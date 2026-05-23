import { useAuth } from "@/contexts/AuthContext";
import { useApproval } from "@/contexts/ApprovalContext";
import { useInventory } from "@/contexts/InventoryContext";

/**
 * Encapsulates the policy for creating/updating/deleting products.
 *
 * - Admin users invoke the inventory mutations directly.
 * - Managers/employees submit a change request which must later be approved.
 *
 * This hook must be called from a component that is rendered inside both
 * <InventoryProvider> and <ApprovalProvider> (order doesn’t matter here).
 */
export function useProductChange() {
  const { user } = useAuth();
  const { submitChange } = useApproval();
  const { addProduct, updateProduct, deleteProduct, products } = useInventory();

  const requestProductChange = async (
    action: "create" | "update" | "delete",
    productData: any,
    productId?: string,
    reason?: string,
  ) => {
    if (user?.role === "admin") {
      if (action === "create") {
        addProduct(productData);
      } else if (action === "update" && productId) {
        updateProduct(productId, productData);
      } else if (action === "delete" && productId) {
        deleteProduct(productId);
      }
    } else {
      submitChange({
        type: "product",
        action,
        entityId: productId,
        originalData: productId
          ? products.find((p) => p.id === productId)
          : undefined,
        proposedData: productData,
        requestedBy: user?.email || "",
        reason,
      });
    }
  };

  return { requestProductChange };
}
