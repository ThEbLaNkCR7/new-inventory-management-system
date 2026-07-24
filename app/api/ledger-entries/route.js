import dbConnect from "../../../lib/mongodb.js"
import LedgerEntry from "../../../models/LedgerEntry.js"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")

    const filter = { isActive: true }
    if (accountId) {
      filter.ledgerAccountId = accountId
    }

    const entries = await LedgerEntry.find(filter).sort({ englishDate: 1, createdAt: 1 })
    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Error fetching ledger entries:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()
    const entry = new LedgerEntry(body)
    await entry.save()
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Error creating ledger entry:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
