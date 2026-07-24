import dbConnect from "../../../../lib/mongodb.js"
import LedgerAccount from "../../../../models/LedgerAccount.js"
import { NextResponse } from "next/server"

export async function GET(_request, { params }) {
  try {
    await dbConnect()
    const account = await LedgerAccount.findById(params.id)
    if (!account) {
      return NextResponse.json({ message: "Ledger account not found" }, { status: 404 })
    }
    return NextResponse.json(account)
  } catch (error) {
    console.error("Error fetching ledger account:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect()
    const body = await request.json()
    const account = await LedgerAccount.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })
    if (!account) {
      return NextResponse.json({ message: "Ledger account not found" }, { status: 404 })
    }
    return NextResponse.json(account)
  } catch (error) {
    console.error("Error updating ledger account:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    await dbConnect()
    const account = await LedgerAccount.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true },
    )
    if (!account) {
      return NextResponse.json({ message: "Ledger account not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Ledger account deleted successfully" })
  } catch (error) {
    console.error("Error deleting ledger account:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
