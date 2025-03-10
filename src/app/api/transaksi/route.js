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

    // Hitung cicilan per bulan untuk transaksi cicilan
    if (data.metode_pembayaran === "cicilan") {
      if (data.dp === undefined || data.dp === null) {
        return NextResponse.json(
          { error: "Down Payment (DP) harus diisi untuk cicilan" },
          { status: 400 },
        );
      }
      if (!data.tenor || data.tenor <= 0) {
        return NextResponse.json(
          { error: "Tenor harus diisi untuk cicilan" },
          { status: 400 },
        );
      }
      // Total cicilan yang harus dicicil adalah total harga dikurangi DP
      const cicilanPerBulan = (data.total_harga - data.dp) / data.tenor;
      data.cicilanPerBulan = cicilanPerBulan;

      if (!cicilanPerBulan || cicilanPerBulan <= 0) {
        return NextResponse.json(
          { error: "Cicilan per bulan tidak valid" },
          { status: 400 },
        );
      }
      // Buat jadwal pembayaran otomatis setiap 30 hari
      const schedule = [];
      const interval = 30 * 24 * 60 * 60 * 1000; // 30 hari dalam milidetik
      const startDate = new Date(); // Tanggal transaksi sebagai awal
      for (let i = 1; i <= data.tenor; i++) {
        const dueDate = new Date(startDate.getTime() + i * interval);
        schedule.push({
          dueDate,
          installment: cicilanPerBulan,
          paid: false, // Status awal: belum dibayar
        });
      }
      data.jadwalPembayaran = schedule;
    }

    // Buat transaksi baru
    const newTransaction = new Transaksi(data);
    await newTransaction.save();

    // Update stok produk berdasarkan tipe transaksi
    if (newTransaction.produk && newTransaction.produk.length > 0) {
      for (const detail of newTransaction.produk) {
        // Ambil konversi dari satuan pertama; default 1 jika tidak ada
        const conversion =
          detail.satuans && detail.satuans[0]?.konversi
            ? detail.satuans[0].konversi
            : 1;
        const adjustment = detail.quantity * conversion;
        if (newTransaction.tipe_transaksi === "penjualan") {
          // Kurangi stok produk
          await Product.findByIdAndUpdate(detail.productId, {
            $inc: { jumlah: -adjustment },
          });
        } else if (newTransaction.tipe_transaksi === "pembelian") {
          // Tambah stok produk
          await Product.findByIdAndUpdate(detail.productId, {
            $inc: { jumlah: adjustment },
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
      { error: "Internal Server Error", details: error.message, status: 500 },
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
          const dayOfWeek = now.getDay(); // 0 (Minggu) - 6 (Sabtu)
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

    // Ambil data update dari body
    let updateData = await req.json();

    // Normalisasi field pengantar dan staff_bongkar jika tidak ada atau kosong
    if (!updateData.pengantar || updateData.pengantar === "") {
      updateData.pengantar = null;
    }
    if (!updateData.staff_bongkar || updateData.staff_bongkar === "") {
      updateData.staff_bongkar = null;
    }

    // Cari transaksi yang akan diupdate
    const transaction = await Transaksi.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Jika transaksi menggunakan metode cicilan, pastikan metode pembayaran tetap "cicilan"
    if (transaction.metode_pembayaran === "cicilan") {
      updateData.metode_pembayaran = "cicilan";

      // Jika status diupdate menjadi "lunas", tandai seluruh jadwal sebagai paid
      if (updateData.status_transaksi === "lunas") {
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
      // Jika ada pembaruan pada dp, tenor, atau cicilanPerBulan, hitung ulang jadwal pembayaran otomatis
      else if (
        updateData.dp !== undefined ||
        updateData.tenor !== undefined ||
        updateData.cicilanPerBulan !== undefined
      ) {
        const dpValue =
          updateData.dp !== undefined ? updateData.dp : transaction.dp || 0;
        const tenorValue =
          updateData.tenor !== undefined ? updateData.tenor : transaction.tenor;
        const installmentValue =
          updateData.cicilanPerBulan !== undefined
            ? updateData.cicilanPerBulan
            : transaction.cicilanPerBulan;
        if (!tenorValue || !installmentValue) {
          return NextResponse.json(
            {
              error:
                "Untuk transaksi cicilan, tenor dan cicilanPerBulan harus diisi.",
            },
            { status: 400 },
          );
        }
        const schedule = [];
        const interval = 30 * 24 * 60 * 60 * 1000; // 30 hari dalam milidetik
        const startDate = new Date();
        for (let i = 1; i <= tenorValue; i++) {
          const dueDate = new Date(startDate.getTime() + i * interval);
          schedule.push({
            dueDate,
            installment: installmentValue,
            paid: false,
          });
        }
        updateData.jadwalPembayaran = schedule;
      }
    }

    // Terapkan update ke dokumen transaksi dan tunggu penyimpanannya
    transaction.set(updateData);
    const updatedTransaction = await transaction.save();
    if (!updatedTransaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Transaksi berhasil diperbarui",
      data: updatedTransaction,
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
