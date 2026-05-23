import { useAuth } from "@/contexts/AuthContext";
import { useApproval } from "@/contexts/ApprovalContext";
import { useInventory } from "@/contexts/InventoryContext";

/**
 * Wrapper for creating/updating/deleting sales with role-based approval.
 * Admins make changes directly; managers/employees submit a request.
 */
export function useSaleChange() {
  const { user } = useAuth();
  const { submitChange } = useApproval();
  const { addSale, updateSale, deleteSale, sales } = useInventory();

  const requestSaleChange = async (
    action: "create" | "update" | "delete",
    saleData: any,
    saleId?: string,
    reason?: string,
  ) => {
    if (user?.role === "admin") {
      if (action === "create") {
        addSale(saleData);
      } else if (action === "update" && saleId) {
        updateSale(saleId, saleData);
      } else if (action === "delete" && saleId) {
        deleteSale(saleId);
      }
    } else {
      submitChange({
        type: "sale",
        action,
        entityId: saleId,
        originalData: saleId ? sales.find((s) => s.id === saleId) : undefined,
        proposedData: saleData,
        requestedBy: user?.email || "",
        reason,
      });
    }
  };

  return { requestSaleChange };
}
