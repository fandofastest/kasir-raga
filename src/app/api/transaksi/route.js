import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import User from "@/models/user";
import Transaksi from "@/models/transaksi";
import Supplier from "@/models/supplier";
import Product from "@/models/product"; // Pastikan path dan nama model sesuai

import { connectToDatabase } from "@/lib/mongodb";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();
    const userid = req.user?.id;
    console.log("Data transaksi:", data);

    // Validasi: pastikan kasir ada
    const kasir = await User.findById(userid);
    if (!kasir) {
      return NextResponse.json(
        { error: "Kasir tidak ditemukan" },
        { status: 400 },
      );
    }
    data.kasir = userid;

    // Jika metode pembayaran adalah cicilan, hitung tanggalMaksimalPelunasan
    if (data.metode_pembayaran === "cicilan") {
      if (data.dp === undefined || data.dp === null) {
        return NextResponse.json(
          { error: "Down Payment (DP) harus diisi untuk cicilan" },
          { status: 400 },
        );
      }
      if (!data.durasiPelunasan || data.durasiPelunasan <= 0) {
        return NextResponse.json(
          { error: "Durasi pelunasan harus diisi dan lebih dari 0" },
          { status: 400 },
        );
      }
      // Jika unitPelunasan tidak diberikan, default ke "hari"
      data.unitPelunasan = data.unitPelunasan || "hari";

      // Hitung tanggalMaksimalPelunasan: current date + durasiPelunasan (berdasarkan unit)
      let dueDate = new Date();
      if (data.unitPelunasan === "bulan") {
        dueDate.setMonth(dueDate.getMonth() + data.durasiPelunasan);
      } else {
        // unit "hari"
        dueDate.setDate(dueDate.getDate() + data.durasiPelunasan);
      }
      data.tanggalMaksimalPelunasan = dueDate;

      // Pastikan jadwalPembayaran ada untuk mencatat histori pembayaran
      if (!data.jadwalPembayaran) {
        data.jadwalPembayaran = [];
      }
    }

    // Buat transaksi baru
    const newTransaction = new Transaksi(data);
    await newTransaction.save();

    // Update stok produk berdasarkan tipe transaksi
    if (newTransaction.produk && newTransaction.produk.length > 0) {
      for (const detail of newTransaction.produk) {
        const conversion =
          detail.satuans && detail.satuans[0]?.konversi
            ? detail.satuans[0].konversi
            : 1;
        const adjustment = detail.quantity * conversion;
        if (newTransaction.tipe_transaksi === "penjualan") {
          await Product.findByIdAndUpdate(detail.productId, {
            $inc: { jumlah: -adjustment },
          });
        }
      }
    }

    const populatedTransactionFull = await Transaksi.findById(
      newTransaction._id,
    )
      .populate("kasir")
      .populate("produk.productId")
      .populate("supplier")
      .populate("pembeli")
      .populate("pengantar")
      .populate("staff_bongkar")
      .exec();

    return NextResponse.json({
      message: "Transaksi berhasil dibuat",
      data: populatedTransactionFull,
      status: 201,
    });
  } catch (error) {
    console.error("Gagal membuat transaksi:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
        status: 500,
      },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    // Buat filter objek dari query parameters
    const filter = {};
    if (searchParams.has("metode_pembayaran")) {
      filter.metode_pembayaran = searchParams.get("metode_pembayaran");
    }
    if (searchParams.has("status_transaksi")) {
      filter.status_transaksi = searchParams.get("status_transaksi");
    }
    if (searchParams.has("tipe_transaksi")) {
      filter.tipe_transaksi = searchParams.get("tipe_transaksi");
    }
    if (searchParams.has("supplier")) {
      const supplierName = searchParams.get("supplier");
      const supplierDoc = await Supplier.findOne({
        nama: { $regex: supplierName, $options: "i" },
      });
      // Asumsikan field supplier menyimpan _id_ supplier
      filter.supplier = supplierDoc ? supplierDoc._id : null;
    }
    if (searchParams.has("pelanggan")) {
      // Filter berdasarkan pelanggan, misalnya field 'pembeli'
      // Pastikan bahwa nilai yang dikirim adalah ID pelanggan
      filter.pembeli = searchParams.get("pelanggan");
    }
    if (searchParams.has("pengantar")) {
      const pengantarName = searchParams.get("pengantar");
      const pengantarDoc = await User.findOne({
        name: { $regex: pengantarName, $options: "i" },
      });
      filter.pengantar = pengantarDoc ? pengantarDoc._id : null;
    }
    if (searchParams.has("staff_bongkar")) {
      const staffBongkarName = searchParams.get("staff_bongkar");
      const staffBongkarDoc = await User.findOne({
        name: { $regex: staffBongkarName, $options: "i" },
      });
      filter.staff_bongkar = staffBongkarDoc ? staffBongkarDoc._id : null;
    }
    if (searchParams.has("kasir")) {
      const kasirName = searchParams.get("kasir");
      const kasirDoc = await User.findOne({
        name: { $regex: kasirName, $options: "i" },
      });
      filter.kasir = kasirDoc ? kasirDoc._id : null;
    }
    if (searchParams.has("minTotal") || searchParams.has("maxTotal")) {
      filter.total_harga = {};
      if (searchParams.has("minTotal")) {
        filter.total_harga.$gte = Number(searchParams.get("minTotal"));
      }
      if (searchParams.has("maxTotal")) {
        filter.total_harga.$lte = Number(searchParams.get("maxTotal"));
      }
    }
    // Filter berdasarkan rentang tanggal jika startDate/endDate diberikan
    if (searchParams.has("startDate") || searchParams.has("endDate")) {
      filter.createdAt = {};
      if (searchParams.has("startDate")) {
        filter.createdAt.$gte = new Date(searchParams.get("startDate"));
      }
      if (searchParams.has("endDate")) {
        const end = new Date(searchParams.get("endDate"));
        // Set ke akhir hari: 23:59:59.999
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    // Filter relatif berdasarkan periode: day, week, month, atau year
    if (searchParams.has("period")) {
      const period = searchParams.get("period");
      const now = new Date();
      let start;
      let end;
      switch (period) {
        case "day":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case "week":
          // Misal minggu dimulai dari Minggu
          const dayOfWeek = now.getDay();
          start = new Date(now);
          start.setDate(now.getDate() - dayOfWeek);
          end = new Date(start);
          end.setDate(start.getDate() + 7);
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          break;
      }
      if (start && end) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$gte = start;
        filter.createdAt.$lt = end;
      }
    }
    if (searchParams.has("search")) {
      const searchValue = searchParams.get("search");
      filter.$or = [{ no_transaksi: { $regex: searchValue, $options: "i" } }];
    }

    // Sorting: parameter sortBy dan sortOrder (asc atau desc)
    let sort = {};
    if (searchParams.has("sortBy")) {
      const sortBy = searchParams.get("sortBy");
      const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
      sort[sortBy] = sortOrder;
    } else {
      // Default sort berdasarkan createdAt descending
      sort = { createdAt: -1 };
    }

    // Query transaksi dengan filter dan sort
    const transactions = await Transaksi.find(filter)
      .populate("kasir supplier pembeli pengantar staff_bongkar")
      .populate("produk.productId")
      .populate("produk.satuans", "nama") // hanya ambil field nama dari Satuan

      .sort(sort);

    // Agregasi untuk total transaksi dan total harga
    const totalTransactions = await Transaksi.countDocuments(filter);
    const aggregate = await Transaksi.aggregate([
      { $match: filter },
      { $group: { _id: null, sumTotal: { $sum: "$total_harga" } } },
    ]);
    const sumTotal = aggregate.length > 0 ? aggregate[0].sumTotal : 0;

    return NextResponse.json({
      transactions,
      totalTransactions,
      sumTotal,
      status: 200,
    });
  } catch (error) {
    console.error("Gagal mengambil transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});
// UPDATE Transaksi
export const PUT = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi tidak ditemukan" },
        { status: 400 },
      );
    }

    const userid = req.user?.id;

    // Validasi: pastikan kasir ada
    const kasir = await User.findById(userid);
    if (!kasir) {
      return NextResponse.json(
        { error: "Kasir tidak ditemukan" },
        { status: 400 },
      );
    }

    let updateData = await req.json();
    updateData.kasir = userid;

    // Normalisasi field pengantar dan staff_bongkar
    if (!updateData.pengantar || updateData.pengantar === "") {
      updateData.pengantar = null;
    }
    if (!updateData.staff_bongkar || updateData.staff_bongkar === "") {
      updateData.staff_bongkar = null;
    }

    // Cari transaksi lama
    const transaction =
      await Transaksi.findById(id).populate("produk.productId");
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // ---------- LOGIKA CICILAN ----------
    if (transaction.metode_pembayaran === "cicilan") {
      updateData.metode_pembayaran = "cicilan";

      if (updateData.status_transaksi === "lunas") {
        // Tandai seluruh jadwalPembayaran terbayar
        if (
          transaction.jadwalPembayaran &&
          transaction.jadwalPembayaran.length > 0
        ) {
          const now = new Date();
          transaction.jadwalPembayaran.forEach((inst) => {
            inst.paid = true;
            inst.paymentDate = now;
          });
          updateData.jadwalPembayaran = transaction.jadwalPembayaran;
        }
      }

      if (
        updateData.dp !== undefined ||
        updateData.durasiPelunasan !== undefined ||
        updateData.unitPelunasan !== undefined
      ) {
        const durasi =
          updateData.durasiPelunasan !== undefined
            ? updateData.durasiPelunasan
            : transaction.durasiPelunasan;
        const unit =
          updateData.unitPelunasan !== undefined
            ? updateData.unitPelunasan
            : transaction.unitPelunasan || "hari";
        if (!durasi || durasi <= 0) {
          return NextResponse.json(
            { error: "Durasi pelunasan harus diisi dan lebih dari 0" },
            { status: 400 },
          );
        }
        let newDueDate = new Date();
        if (unit === "bulan") {
          newDueDate.setMonth(newDueDate.getMonth() + durasi);
        } else {
          newDueDate.setDate(newDueDate.getDate() + durasi);
        }
        updateData.tanggalMaksimalPelunasan = newDueDate;
      }
    }

    // ---------- LOGIKA BATAL ----------
    if (updateData.status_transaksi === "batal") {
      // Cek apakah status sebelumnya sudah "lunas" atau "batal"
      // misal: jika sudah lunas, mungkin tidak boleh dibatalkan
      if (
        transaction.status_transaksi === "lunas" ||
        transaction.status_transaksi === "batal"
      ) {
        return NextResponse.json(
          {
            error: `Transaksi sudah ${
              transaction.status_transaksi
            }, tidak bisa dibatalkan`,
          },
          { status: 400 },
        );
      }

      // Kembalikan stok
      if (
        transaction.produk &&
        Array.isArray(transaction.produk) &&
        transaction.produk.length > 0
      ) {
        for (const detail of transaction.produk) {
          const productDoc = detail.productId;
          if (!productDoc) continue; // jaga2
          // asumsikan field konversi di detail.satuans[0] (atau di detail?).
          // jika tidak ada, default 1
          const conversion =
            detail.satuans &&
            Array.isArray(detail.satuans) &&
            detail.satuans[0]?.konversi
              ? detail.satuans[0].konversi
              : 1;

          const adjustment = detail.quantity * conversion;

          // jika penjualan => stok +adjustment
          if (transaction.tipe_transaksi === "penjualan") {
            await Product.findByIdAndUpdate(productDoc._id, {
              $inc: { jumlah: adjustment },
            });
          }
        }
      }
    }

    // Terapkan update & simpan
    transaction.set(updateData);
    const updatedTransaction = await transaction.save();
    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    const populatedTransactionFull = await Transaksi.findById(id)
      .populate("kasir")
      .populate("produk.productId")
      .populate("supplier")
      .populate("pembeli")
      .populate("pengantar")
      .populate("staff_bongkar")
      .exec();

    return NextResponse.json({
      message: "Transaksi berhasil diperbarui",
      data: populatedTransactionFull,
    });
  } catch (error) {
    console.error("Gagal mengupdate transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});

// DELETE Transaksi
export const DELETE = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi tidak ditemukan" },
        { status: 400 },
      );
    }

    const transaction = await Transaksi.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    const deletedTransaction = await Transaksi.findByIdAndDelete(id);
    return NextResponse.json({
      message: "Transaksi berhasil dihapus",
      data: deletedTransaction,
    });
  } catch (error) {
    console.error("Gagal menghapus transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});
