import Approval from "../../../../models/Approval.js"
import { buildChangeSummary, getChangedFields, getEntityLabel, pickImportantFields, toHistoryRecord } from "../../../../lib/approvalStorage.js"
import dbConnect from "../../../../lib/mongodb.js"
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

export async function PATCH(request, { params }) {
  try {
    await dbConnect()
    const body = await request.json()
    const existing = await Approval.findById(params.id)

    if (!existing) {
      return NextResponse.json({ message: "Approval not found" }, { status: 404 })
    }

    const status = body.status
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    const sanitizedOriginal = pickImportantFields(existing.type, existing.originalData)
    const sanitizedProposed = pickImportantFields(existing.type, existing.proposedData)

    const historyPayload = toHistoryRecord({
      ...existing.toObject(),
      status,
      reviewedBy: body.reviewedBy,
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : new Date(),
      reviewNotes: body.reviewNotes,
      entityLabel: existing.entityLabel || getEntityLabel(existing.type, sanitizedProposed, sanitizedOriginal),
      changeSummary:
        existing.changeSummary ||
        buildChangeSummary(existing.type, existing.action, sanitizedOriginal, sanitizedProposed),
      changedFields:
        existing.changedFields?.length > 0
          ? existing.changedFields
          : getChangedFields(sanitizedOriginal, sanitizedProposed),
    })

    const { originalData, proposedData, ...setPayload } = historyPayload

    const approval = await Approval.findByIdAndUpdate(
      params.id,
      {
        $set: setPayload,
        $unset: { originalData: "", proposedData: "" },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    return NextResponse.json(normalizeApproval(approval))
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
