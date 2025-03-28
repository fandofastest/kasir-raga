import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import User from "@/models/user";
import Transaksi from "@/models/transaksi";
import Supplier from "@/models/supplier";
import Product from "@/models/product"; // Pastikan path dan nama model sesuai
import Konsumen from "@/models/konsumen";
import { connectToDatabase } from "@/lib/mongodb";
import { updateDataTransaction } from "@/lib/dataService";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();
    const userid = req.user?.id;
    console.log("Data transaksi:", data.produk[0].satuans[0].satuan);

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
        console.log("====================================");
        console.log("adjustment", newTransaction);
        console.log("====================================");
        if (
          newTransaction.tipe_transaksi === "pembelian" &&
          (newTransaction.status_transaksi === "lunas" ||
            newTransaction.metode_pembayaran === "cicilan")
        ) {
          await Product.findByIdAndUpdate(detail.productId, {
            $inc: { jumlah: adjustment },
          });
          if (detail.harga !== detail.harga_modal) {
            await Product.findByIdAndUpdate(detail.productId, {
              harga_modal: detail.harga_modal,
            });
          }
          if (detail.satuans && detail.satuans.length > 0) {
            for (const satuanId of detail.satuans) {
              await Product.updateOne(
                { _id: detail.productId, "satuans.satuan": satuanId._id },
                { $set: { "satuans.$.harga": detail.harga } },
              );
            }
          }
          // Update detail satuans di produk
          if (detail.satuans && detail.satuans.length > 0) {
            for (const satuanDetail of detail.satuans) {
              // satuanDetail harus memiliki: satuan, konversi, harga
              await Product.updateOne(
                {
                  _id: detail.productId,
                  "satuans.satuan": satuanDetail.satuan,
                },
                {
                  $set: {
                    "satuans.$.harga": satuanDetail.harga,
                    "satuans.$.konversi": satuanDetail.konversi,
                  },
                },
              );
            }
          }
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
    const statusTransaksiParam = searchParams.get("status_transaksi");
    if (statusTransaksiParam) {
      const statusTransaksiValues = statusTransaksiParam.split(",");
      filter.status_transaksi =
        statusTransaksiValues.length === 1
          ? statusTransaksiValues[0]
          : { $in: statusTransaksiValues };
    }

    if (searchParams.has("tipe_transaksi")) {
      filter.tipe_transaksi = searchParams.get("tipe_transaksi");
    }
    if (searchParams.has("supplier")) {
      // Asumsikan field supplier menyimpan _id_ supplier
      filter.supplier = searchParams.get("supplier");
    }

    if (searchParams.has("pembeli")) {
      filter.pembeli = searchParams.get("pembeli");
    }
    if (searchParams.has("pelanggan")) {
      filter.pembeli = searchParams.get("pelanggan");
    }
    if (searchParams.has("pengantar")) {
      filter.pengantar = searchParams.get("pengantar");
    }
    if (searchParams.has("staff_bongkar")) {
      filter.staff_bongkar = searchParams.get("staff_bongkar");
    }
    if (searchParams.has("kasir")) {
      filter.kasir = searchParams.get("kasir");
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
      filter.tanggal_transaksi = {};
      if (searchParams.has("startDate")) {
        filter.tanggal_transaksi.$gte = new Date(searchParams.get("startDate"));
      }
      if (searchParams.has("endDate")) {
        const end = new Date(searchParams.get("endDate"));
        // Set ke akhir hari: 23:59:59.999
        end.setHours(23, 59, 59, 999);
        filter.tanggal_transaksi.$lte = end;
      }
    } else if (
      !searchParams.has("startDate") &&
      !searchParams.has("endDate") &&
      !searchParams.has("period")
    ) {
      // Jika tanggal tidak diset, ambil data dalam bulan ini saja
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      filter.tanggal_transaksi = { $gte: startOfMonth, $lte: endOfMonth };
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
        filter.tanggal_transaksi = filter.tanggal_transaksi || {};
        filter.tanggal_transaksi.$gte = start;
        filter.tanggal_transaksi.$lt = end;
      }
    }
    if (searchParams.has("search")) {
      const searchValue = searchParams.get("search");
      filter.$or = [{ no_transaksi: { $regex: searchValue, $options: "i" } }];
    }

    // --- Tambahan filter berdasarkan produk dan kategori ---
    // Gunakan operator $and untuk menggabungkan kondisi pada produk
    const andConditions = [];
    if (searchParams.has("produk")) {
      const produkName = searchParams.get("produk");
      const productDoc = await Product.findOne({
        nama_produk: { $regex: produkName, $options: "i" },
      });
      andConditions.push({
        "produk.productId": productDoc ? productDoc._id : null,
      });
    }
    if (searchParams.has("kategori")) {
      const kategoriValue = searchParams.get("kategori");
      // Asumsikan kategori dikirim sebagai ID kategori
      const productsInCategory = await Product.find({
        kategori: kategoriValue,
      }).select("_id");
      const productIdsInCategory = productsInCategory.map((p) => p._id);
      andConditions.push({
        "produk.productId": { $in: productIdsInCategory },
      });
    }
    if (andConditions.length > 0) {
      filter.$and = filter.$and
        ? filter.$and.concat(andConditions)
        : andConditions;
    }
    // --- End tambahan filter produk & kategori ---

    // Sorting: parameter sortBy dan sortOrder (asc atau desc)
    let sort = {};
    if (searchParams.has("sortBy")) {
      const sortBy = searchParams.get("sortBy");
      const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
      sort[sortBy] = sortOrder;
    } else {
      // Default sort berdasarkan createdAt descending
      sort = { tanggal_transaksi: -1 };
    }

    // Query transaksi dengan filter dan sort
    const transactions = await Transaksi.find(filter)
      .populate("kasir supplier pembeli pengantar staff_bongkar")
      .populate("produk.productId")
      .populate("produk.satuans.satuan")

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

    // console.log("====================================");
    // console.log(updateData);
    // console.log("====================================");
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
    // ---------- LOGIKA PENJUALAN TUNDA STOCK ADJUSTMENT ----------
    if (
      transaction.tipe_transaksi === "penjualan" &&
      transaction.status_transaksi === "tunda" &&
      updateData.status_transaksi === "tunda"
    ) {
      // Buat mapping untuk detail produk asli berdasarkan productId
      const originalDetailsMap = {};

      if (transaction.produk && Array.isArray(transaction.produk)) {
        for (const detail of transaction.produk) {
          if (!detail.productId) continue;

          const productId = detail.productId._id.toString();
          const conversion =
            detail.satuans &&
            Array.isArray(detail.satuans) &&
            detail.satuans[0]?.konversi
              ? detail.satuans[0].konversi
              : 1;
          const oldDeduction = detail.quantity * conversion;

          originalDetailsMap[productId] = oldDeduction;
        }
      }

      // Bandingkan dengan detail produk yang baru
      if (updateData.produk && Array.isArray(updateData.produk)) {
        for (const detail of updateData.produk) {
          if (!detail.productId) continue;
          const productId = detail.productId;
          console.log(detail);

          const conversion =
            detail.satuans &&
            Array.isArray(detail.satuans) &&
            detail.satuans[0]?.konversi
              ? detail.satuans[0].konversi
              : 1;
          const newDeduction = detail.quantity * conversion;
          const oldDeduction = originalDetailsMap[productId];
          const difference = newDeduction - oldDeduction;

          if (difference !== 0) {
            // Untuk transaksi penjualan, stok sudah dikurangi sebesar oldDeduction,
            // jadi jika newDeduction lebih besar, perlu pengurangan stok tambahan (dengan nilai -difference)
            // dan sebaliknya jika newDeduction lebih kecil, stok dikembalikan.
            await Product.findByIdAndUpdate(productId, {
              $inc: { jumlah: -difference },
            });
          }
          // Hapus item yang sudah diproses
          delete originalDetailsMap[productId];
        }
      }

      // Untuk produk yang tadinya ada tapi di update tidak ada, kembalikan stoknya
      for (const productId in originalDetailsMap) {
        const oldDeduction = originalDetailsMap[productId];
        await Product.findByIdAndUpdate(productId, {
          $inc: { jumlah: oldDeduction },
        });
      }
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
      if (transaction.status_transaksi === "batal") {
        return NextResponse.json(
          {
            error: `Transaksi sudah ${transaction.status_transaksi}, tidak bisa dibatalkan`,
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
          if (!productDoc) continue; // jaga-jaga
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

    // ---------- LOGIKA PEMBELIAN ----------
    // Jika tipe transaksi pembelian dan status baru adalah "lunas",
    // serta sebelumnya belum lunas, maka tambahkan stok produk.
    if (
      updatedTransaction.tipe_transaksi === "pembelian" &&
      updatedTransaction.status_transaksi === "lunas"
    ) {
      if (
        updatedTransaction.produk &&
        Array.isArray(updatedTransaction.produk) &&
        updatedTransaction.produk.length > 0
      ) {
        for (const detail of updatedTransaction.produk) {
          const productDoc = detail.productId;
          if (!productDoc) continue;
          const conversion =
            detail.satuans &&
            Array.isArray(detail.satuans) &&
            detail.satuans[0]?.konversi
              ? detail.satuans[0].konversi
              : 1;
          const adjustment = detail.quantity * conversion;
          if (detail.harga !== detail.harga_modal) {
            await Product.findByIdAndUpdate(productDoc._id, {
              harga_modal: detail.harga_modal,
            });
          }
          await Product.findByIdAndUpdate(productDoc._id, {
            $inc: { jumlah: adjustment },
          });
        }
      }
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
      status: 200,
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
