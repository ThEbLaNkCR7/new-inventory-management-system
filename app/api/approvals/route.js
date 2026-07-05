import Approval from "../../../models/Approval.js"
import { sanitizeApprovalPayload } from "../../../lib/approvalStorage.js"
import dbConnect from "../../../lib/mongodb.js"
import { NextResponse } from "next/server"

function normalizeApproval(doc) {
  const obj = doc.toObject ? doc.toObject() : doc
  return {
    ...obj,
    id: obj._id?.toString(),
    requestedAt: obj.requestedAt?.toISOString?.() || obj.requestedAt,
    reviewedAt: obj.reviewedAt?.toISOString?.() || obj.reviewedAt,
  }
}

export async function GET() {
  try {
    await dbConnect()
    const approvals = await Approval.find().sort({ requestedAt: -1 }).limit(500)
    return NextResponse.json({ approvals: approvals.map(normalizeApproval) })
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    const body = await request.json()
    const payload = sanitizeApprovalPayload(body)

    const approval = await Approval.create({
      ...payload,
      requestedAt: body.requestedAt ? new Date(body.requestedAt) : new Date(),
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : undefined,
    })

    return NextResponse.json(normalizeApproval(approval), { status: 201 })
  } catch (error) {
    console.error("Approval creation error:", error)
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 })
  }
}
