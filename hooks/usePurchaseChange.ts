import { useAuth } from "@/contexts/AuthContext";
import { useApproval } from "@/contexts/ApprovalContext";
import { useInventory } from "@/contexts/InventoryContext";

/**
 * Wrapper for creating/updating/deleting purchases with role-based approval.
 */
export function usePurchaseChange() {
  const { user } = useAuth();
  const { submitChange } = useApproval();
  const { addPurchase, updatePurchase, deletePurchase, purchases } =
    useInventory();

  const requestPurchaseChange = async (
    action: "create" | "update" | "delete",
    purchaseData: any,
    purchaseId?: string,
    reason?: string,
  ) => {
    if (user?.role === "admin") {
      if (action === "create") {
        addPurchase(purchaseData);
      } else if (action === "update" && purchaseId) {
        updatePurchase(purchaseId, purchaseData);
      } else if (action === "delete" && purchaseId) {
        deletePurchase(purchaseId);
      }
    } else {
      submitChange({
        type: "purchase",
        action,
        entityId: purchaseId,
        originalData: purchaseId
          ? purchases.find((p) => p.id === purchaseId)
          : undefined,
        proposedData: purchaseData,
        requestedBy: user?.email || "",
        reason,
      });
    }
  };

  return { requestPurchaseChange };
}
