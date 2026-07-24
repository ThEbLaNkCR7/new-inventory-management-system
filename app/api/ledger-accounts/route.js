import dbConnect from "../../../lib/mongodb.js"
import LedgerAccount from "../../../models/LedgerAccount.js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await dbConnect()
    const accounts = await LedgerAccount.find({ isActive: true }).sort({ name: 1 })
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Error fetching ledger accounts:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()
    const account = new LedgerAccount(body)
    await account.save()
    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Error creating ledger account:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
