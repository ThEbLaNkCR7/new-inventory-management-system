import dbConnect from "../../../../lib/mongodb.js"
import LedgerEntry from "../../../../models/LedgerEntry.js"
import { NextResponse } from "next/server"

export async function GET(_request, { params }) {
  try {
    await dbConnect()
    const entry = await LedgerEntry.findById(params.id)
    if (!entry) {
      return NextResponse.json({ message: "Ledger entry not found" }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error fetching ledger entry:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()
    const body = await request.json()
    const entry = await LedgerEntry.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
    if (!entry) {
      return NextResponse.json({ message: "Ledger entry not found" }, { status: 404 })
    }
    return NextResponse.json(entry)
  } catch (error) {
    console.error("Error updating ledger entry:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    await dbConnect()
    const entry = await LedgerEntry.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true },
    )
    if (!entry) {
      return NextResponse.json({ message: "Ledger entry not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Ledger entry deleted successfully" })
  } catch (error) {
    console.error("Error deleting ledger entry:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
