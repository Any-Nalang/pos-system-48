import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { sortCupInventoryItems, parseCupInfoKey } from "@/lib/cup-utils";
import { formatPeso } from "@/lib/format-currency";
import { usePosItemCustomizeDialog } from "../hooks/usePosItemCustomizeDialog";
import {
  posAddonDefault,
  posAddonSelected,
  posBtnPrimary,
  posBtnSecondary,
  posMutedLabel,
  posSectionMuted,
} from "../pos-ui";
import type { MenuItem } from "../types";

interface AddOnItem {
  addon_id: string;
  name: string;
  price: number;
}

interface PosItemCustomizeDialogProps {
  item: MenuItem | null;
  addOns: AddOnItem[];
  onClose: () => void;
  onConfirm: (params: {
    lineKey: string;
    menu_id: string;
    menu_name: string;
    quantity: number;
    cup_type: string;
    cup_size: string;
    unit_price: number;
    total_price: number;
    discount?: string;
    discount_name?: string;
    discount_id?: string;
    is_free_drink?: boolean;
    selected_inventory_id?: string;
    addon_items?: Array<{
      addon_id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }) => void;
  hasDiscountInCart: boolean;
  initialLine?: {
    quantity: number;
    snapshot_inventory?: string;
    loyalty?: boolean;
    discount_type?: string;
    discount_contact?: string;
    discount_id_number?: string;
    addon_items?: Array<{
      addon_id: string;
      addon_name_snapshot: string;
      addon_price_snapshot: number;
      quantity: number;
    }>;
  } | null;
}

export function PosItemCustomizeDialog({
  item,
  addOns,
  onClose,
  onConfirm,
  hasDiscountInCart,
  initialLine = null,
}: PosItemCustomizeDialogProps) {
  const [selectedInvItem, setSelectedInvItem] = useState<string | null>(null);
  const [showAddons, setShowAddons] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<
    Record<string, { name: string; price: number; quantity: number }>
  >({});

  const cupItems = useMemo(
    () =>
      sortCupInventoryItems(
        item?.inventory_items?.filter((ii) => ii.inventory.type === "CUP") ??
          [],
      ),
    [item?.inventory_items],
  );

  const canUseFreeDrink = selectedInvItem !== null;
  const canDiscount = !hasDiscountInCart;

  const form = usePosItemCustomizeDialog({
    item,
    selectedInvItem,
    cupItems,
    selectedAddons,
    onConfirm,
    onClose,
  });

  useEffect(() => {
    if (!item) return;

    const matchingCup = initialLine?.snapshot_inventory
      ? cupItems.find((c) => {
          const key = parseCupInfoKey(c.inventory.name);
          return (
            c.inventory.name === initialLine.snapshot_inventory ||
            key === initialLine.snapshot_inventory ||
            c.inventory.name.toLowerCase() ===
              initialLine.snapshot_inventory?.toLowerCase()
          );
        })
      : null;

    setSelectedInvItem(
      matchingCup?.inventory.inventory_id ??
        (cupItems.length > 0 ? cupItems[0].inventory.inventory_id : null),
    );

    const initialAddons: Record<
      string,
      { name: string; price: number; quantity: number }
    > = {};
    for (const addon of initialLine?.addon_items ?? []) {
      initialAddons[addon.addon_id] = {
        name: addon.addon_name_snapshot,
        price: Number(addon.addon_price_snapshot),
        quantity: addon.quantity,
      };
    }
    setShowAddons(Object.keys(initialAddons).length > 0);
    setSelectedAddons(initialAddons);

    form.reset({
      discountType:
        initialLine?.discount_type === "PWD" ||
        initialLine?.discount_type === "SENIOR"
          ? initialLine.discount_type
          : "NONE",
      discountName: initialLine?.discount_contact ?? "",
      discountId: initialLine?.discount_id_number ?? "",
      isFreeDrink: initialLine?.loyalty ?? false,
      quantity: initialLine?.quantity ?? 1,
    });
  }, [item, cupItems, initialLine, form]);

  if (!item) return null;

  const selectedCup = cupItems.find(
    (c) => c.inventory.inventory_id === selectedInvItem,
  );
  const basePrice = selectedCup?.price ?? item.price ?? 0;

  const incrementAddon = (addon: AddOnItem) => {
    setSelectedAddons((prev) => {
      const existing = prev[addon.addon_id];
      return {
        ...prev,
        [addon.addon_id]: {
          name: addon.name,
          price: addon.price,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      };
    });
  };

  const decrementAddon = (addon: AddOnItem) => {
    setSelectedAddons((prev) => {
      const existing = prev[addon.addon_id];
      if (!existing || existing.quantity <= 1) {
        const { [addon.addon_id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [addon.addon_id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const liveAddonsTotal = Object.values(selectedAddons).reduce(
    (sum, a) => sum + a.price * a.quantity,
    0,
  );

  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[85dvh] flex flex-col p-3 md:p-6">
        <DialogHeader className="flex-row items-start justify-between gap-1 md:gap-4 shrink-0">
          <div className="space-y-0.5 md:space-y-2">
            <DialogTitle className="text-[10px] font-bold text-(--near-black) md:text-lg">
              {item.name}
            </DialogTitle>
            <DialogDescription className="text-[8px] text-(--medium-gray) md:text-sm">
              Customize your order
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 px-0.5 pb-0.5 overflow-x-hidden md:space-y-5 md:px-2 md:pb-2">
            {/* Cup options */}
            {cupItems.length > 0 ? (
              <div className="space-y-0.5 md:space-y-2">
                <p className={cn(posMutedLabel, "text-[8px] md:text-xs")}>
                  Cup size
                </p>
                <div className="flex flex-wrap gap-0.5 md:gap-2">
                  {cupItems.map((ci) => {
                    const isSelected =
                      selectedInvItem === ci.inventory.inventory_id;
                    return (
                      <Button
                        key={ci.inventory.inventory_id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "flex h-auto flex-1 flex-col items-center gap-0.5 rounded-[5px] py-1 text-[11px] font-semibold md:rounded-xl md:py-2 md:text-sm",
                          isSelected ? posBtnPrimary : posBtnSecondary,
                        )}
                        onClick={() =>
                          setSelectedInvItem(ci.inventory.inventory_id)
                        }
                      >
                        <span>{ci.inventory.name}</span>
                        <span className="text-[9px] opacity-70 md:text-[11px]">
                          {formatPeso(Number(ci.price))}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                {selectedCup && selectedCup.inventory.stock <= 0 && (
                  <p className="rounded-[5px] border border-(--soft-peach) bg-(--pale-yellow) px-1.5 py-1 text-[8px] font-medium text-(--coral) md:rounded-lg md:px-3 md:py-2 md:text-xs">
                    Out of stock &mdash; you can still add this item
                  </p>
                )}
              </div>
            ) : null}

            {/* Add-ons (hidden for free drinks) */}
            <form.Subscribe selector={(state) => state.values.isFreeDrink}>
              {(isFreeDrink) =>
                !isFreeDrink ? (
                  <div className="space-y-0.5 md:space-y-2">
                    <div className="flex items-center justify-between">
                      <p className={cn(posMutedLabel, "text-[8px] md:text-xs")}>
                        Add-ons
                      </p>
                      {addOns.length > 0 ? (
                        <Button
                          variant={showAddons ? "default" : "secondary"}
                          className={cn(
                            showAddons ? posBtnPrimary : posBtnSecondary,
                            "text-[8px] md:text-xs h-6 md:h-9",
                          )}
                          onClick={() => setShowAddons(!showAddons)}
                        >
                          {showAddons ? "Active" : "Add?"}
                        </Button>
                      ) : null}
                    </div>
                    {showAddons && addOns.length > 0 ? (
                      <div className="space-y-0.5 md:space-y-2">
                        {addOns.map((addon) => {
                          const qty =
                            selectedAddons[addon.addon_id]?.quantity ?? 0;
                          return (
                            <div
                              key={addon.addon_id}
                              className={cn(
                                "flex items-center justify-between rounded-[5px] border p-1 transition-all md:rounded-xl md:p-2.5",
                                qty > 0 ? posAddonSelected : posAddonDefault,
                              )}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={cn(
                                    "text-[11px] font-bold md:text-sm",
                                    qty > 0
                                      ? "text-(--deep-forest)"
                                      : "text-(--medium-gray)",
                                  )}
                                >
                                  {addon.name}
                                </span>
                                <span className="text-[9px] opacity-60 md:text-[11px]">
                                  +{formatPeso(addon.price)}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 md:gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="icon-sm"
                                  className={posBtnSecondary}
                                  onClick={() => decrementAddon(addon)}
                                  disabled={qty === 0}
                                >
                                  <MinusIcon className="size-3 md:size-4" />
                                </Button>
                                <span className="w-3 text-center text-[11px] font-bold md:w-5 md:text-sm">
                                  {qty}
                                </span>
                                <Button
                                  variant="default"
                                  size="icon-sm"
                                  className={posBtnPrimary}
                                  onClick={() => incrementAddon(addon)}
                                >
                                  <PlusIcon className="size-3 md:size-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null
              }
            </form.Subscribe>

            {/* Discount & Free Drink */}
            <div className="space-y-1 md:space-y-3">
              {canDiscount ? (
                <div className="space-y-1 md:space-y-3">
                  <form.AppField
                    name="discountType"
                    listeners={{
                      onChange: ({ value }) => {
                        if (value !== "NONE") {
                          form.setFieldValue("quantity", 1);
                          form.setFieldValue("isFreeDrink", false);
                        }
                      },
                    }}
                  >
                    {(field) => (
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(posMutedLabel, "text-[8px] md:text-xs")}
                        >
                          Discount
                        </p>
                        <Select
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v ?? "NONE")}
                        >
                          <SelectTrigger className="h-6 w-auto rounded-full border-(--light-gray) bg-(--off-white) px-1.5 py-0.5 text-[8px] font-semibold text-(--deep-forest) md:h-8 md:px-3 md:text-[10px]">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="SENIOR">Senior (5%)</SelectItem>
                            <SelectItem value="PWD">PWD (5%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </form.AppField>

                  <form.Subscribe
                    selector={(state) => state.values.discountType}
                  >
                    {(discountType) =>
                      discountType !== "NONE" ? (
                        <div className="space-y-0.5 md:space-y-2 **:data-[slot=field]:gap-0.5 md:**:data-[slot=field]:gap-3">
                          <form.AppField name="discountName">
                            {(field) => (
                              <field.Input
                                label="Name"
                                placeholder="Full name"
                                className="h-3 md:h-9 text-[7px] md:text-[7px] md:text-sm rounded-[5px] md:rounded-md"
                              />
                            )}
                          </form.AppField>
                          <form.AppField name="discountId">
                            {(field) => (
                              <field.Input
                                label="ID Number"
                                placeholder="ID #"
                                className="h-3 md:h-9 text-[7px] md:text-[7px] md:text-sm rounded-[5px] md:rounded-md"
                              />
                            )}
                          </form.AppField>
                        </div>
                      ) : null
                    }
                  </form.Subscribe>
                </div>
              ) : null}

              {canUseFreeDrink ? (
                <form.AppField
                  name="isFreeDrink"
                  listeners={{
                    onChange: ({ value }) => {
                      if (value) {
                        form.setFieldValue("discountType", "NONE");
                        form.setFieldValue("discountName", "");
                        form.setFieldValue("discountId", "");
                        setSelectedAddons({});
                        setShowAddons(false);
                      }
                    },
                  }}
                >
                  {(field) => (
                    <div
                      className={cn(
                        "flex items-center justify-between rounded-[5px] p-1 md:rounded-lg md:p-2.5",
                        posSectionMuted,
                      )}
                    >
                      <span className="text-[11px] font-semibold text-(--deep-forest) md:text-sm">
                        Free Drink
                      </span>
                      <Switch
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => {
                          field.handleChange(checked);
                        }}
                        size="default"
                      />
                    </div>
                  )}
                </form.AppField>
              ) : null}
            </div>

            {/* Quantity */}
            <form.Subscribe
              selector={(state) => ({
                isFreeDrink: state.values.isFreeDrink,
                discountType: state.values.discountType,
              })}
            >
              {(vals) => {
                const quantityLocked = vals.discountType !== "NONE";
                return (
                  <div className="flex items-center justify-between">
                    <p className={cn(posMutedLabel, "text-[8px] md:text-xs")}>
                      Quantity
                    </p>
                    <form.AppField name="quantity">
                      {(field) => (
                        <div className="flex items-center gap-0.5 md:gap-2">
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            className={posBtnSecondary}
                            disabled={quantityLocked || field.state.value <= 1}
                            onClick={() =>
                              field.handleChange(
                                Math.max(1, field.state.value - 1),
                              )
                            }
                          >
                            <MinusIcon className="size-3 md:size-4" />
                          </Button>
                          <span className="w-4 text-center text-[11px] font-bold text-(--deep-forest) md:w-6 md:text-sm">
                            {field.state.value}
                          </span>
                          <Button
                            variant="default"
                            size="icon-sm"
                            className={posBtnPrimary}
                            disabled={quantityLocked}
                            onClick={() =>
                              field.handleChange(field.state.value + 1)
                            }
                          >
                            <PlusIcon className="size-3 md:size-4" />
                          </Button>
                        </div>
                      )}
                    </form.AppField>
                  </div>
                );
              }}
            </form.Subscribe>

            {/* Total */}
            <form.Subscribe
              selector={(state) => ({
                isFreeDrink: state.values.isFreeDrink,
                quantity: state.values.quantity,
              })}
            >
              {(vals) => (
                <div
                  className={cn(
                    "flex items-center justify-between rounded-[5px] px-1.5 py-1.5 md:rounded-xl md:px-4 md:py-3",
                    posSectionMuted,
                  )}
                >
                  <span className="text-[8px] font-semibold text-(--medium-gray) md:text-xs">
                    Total
                    {liveAddonsTotal > 0 && !vals.isFreeDrink
                      ? " (incl. add-ons)"
                      : ""}
                  </span>
                  <span className="text-[9px] font-bold text-(--deep-forest) md:text-sm">
                    {formatPeso(
                      vals.isFreeDrink
                        ? 0
                        : (basePrice + liveAddonsTotal) * vals.quantity,
                    )}
                  </span>
                </div>
              )}
            </form.Subscribe>
          </div>

          <DialogFooter className="gap-1 pt-1 md:gap-2 md:pt-4 shrink-0">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 text-[8px] md:text-sm h-6 md:h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex flex-1 items-center justify-center gap-0.5 text-[8px] md:gap-2 md:text-sm h-6 md:h-10"
            >
              Add to cart
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
