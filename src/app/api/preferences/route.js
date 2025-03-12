// app/api/preferences/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Preference from "../../../models/Preference";

export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      darkMode,
      language,
      dateFormat,
      companyName,
      companyLogo,
      companyAddress,
      companyPhone,
    } = body;

    let preference = await Preference.findOne();
    if (preference) {
      // Update dokumen yang sudah ada
      preference.darkMode = darkMode;
      preference.language = language;
      preference.dateFormat = dateFormat;
      preference.companyName = companyName;
      preference.companyLogo = companyLogo;
      preference.companyAddress = companyAddress;
      preference.companyPhone = companyPhone;
      await preference.save();
    } else {
      // Buat dokumen baru
      preference = await Preference.create({
        darkMode,
        language,
        dateFormat,
        companyName,
        companyLogo,
        companyAddress,
        companyPhone,
      });
    }

    return NextResponse.json(
      { success: true, data: preference },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
