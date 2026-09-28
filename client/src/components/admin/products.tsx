import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Loader2, TrendingUp, Plus, Trash2 } from "lucide-react";
import type { Product } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  price: z.string().regex(/^\d+$/, "Enter a whole-number price"),
  dailyEarnings: z.string().regex(/^\d+$/, "Enter a whole-number amount"),
  cycleDays: z.string().regex(/^[1-9]\d*$/, "Duration must be greater than zero"),
  imageUrl: z.string().optional(),
  sortOrder: z.string().regex(/^\d+$/, "Entrez un ordre entier"),
  isFree: z.boolean(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  const price = Number(data.price);
  if (data.isFree ? price !== 0 : price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: data.isFree ? "Un produit gratuit doit avoir un prix de 0 F" : "Le prix doit être supérieur à 0 F",
    });
  }
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProducts() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products/all"],
  });

  const editForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "", imageUrl: "", sortOrder: "0", isFree: false, isActive: true },
  });

  const createForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price: "", dailyEarnings: "", cycleDays: "", imageUrl: "", sortOrder: "0", isFree: false, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La création du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
       toast({ title: "Product created!" });
      setShowCreateForm(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Création du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La mise à jour du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
       toast({ title: "Product updated!" });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({ title: "Mise à jour du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${id}`, { isActive });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La modification de la visibilité du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({ title: "Modification de la visibilité impossible", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${id}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "La suppression du produit a échoué");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
       toast({ title: "Product deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Suppression du produit impossible", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      name: product.name,
      price: product.price.toString(),
      dailyEarnings: product.dailyEarnings.toString(),
      cycleDays: product.cycleDays.toString(),
      imageUrl: product.imageUrl || "",
      sortOrder: product.sortOrder.toString(),
      isFree: product.isFree,
      isActive: product.isActive,
    });
  };

  const handleUpdate = (data: ProductForm) => {
    if (!selectedProduct) return;
    const price = parseInt(data.price);
    const dailyEarnings = parseInt(data.dailyEarnings);
    const cycleDays = parseInt(data.cycleDays);
    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: data.name,
        price,
        dailyEarnings,
        cycleDays,
        totalReturn: dailyEarnings * cycleDays,
        imageUrl: data.imageUrl || null,
        sortOrder: parseInt(data.sortOrder),
        isFree: data.isFree,
        isActive: data.isActive,
      },
    });
  };

  const handleCreate = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  const ProductFormFields = ({ form, isPending, submitLabel }: { form: any; isPending: boolean; submitLabel: string }) => (
    <form onSubmit={form.handleSubmit(submitLabel === "Créer" ? handleCreate : handleUpdate)} className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
           <FormLabel>Product name</FormLabel>
          <FormControl><Input {...field} placeholder="Ex: VIP 3" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem>
             <FormLabel>Price (PHP)</FormLabel>
          <FormControl><Input {...field} type="number" min="0" step="1" placeholder="Ex: 15000" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="dailyEarnings" render={({ field }) => (
          <FormItem>
             <FormLabel>Daily earnings (PHP)</FormLabel>
          <FormControl><Input {...field} type="number" min="0" step="1" placeholder="Ex: 300" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="cycleDays" render={({ field }) => (
        <FormItem>
         <FormLabel>Duration (days)</FormLabel>
          <FormControl><Input {...field} type="number" min="1" step="1" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="sortOrder" render={({ field }) => (
          <FormItem>
             <FormLabel>Display order</FormLabel>
            <FormControl><Input {...field} type="number" min="0" step="1" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="isFree" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
             <FormLabel>Free product</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  const currentPrice = form.getValues("price");
                  if (checked) form.setValue("price", "0", { shouldValidate: true });
                  else if (currentPrice === "0") form.setValue("price", "", { shouldValidate: true });
                }}
              />
            </FormControl>
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="isActive" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
         <FormLabel>Visible in catalog</FormLabel>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
      <FormField control={form.control} name="imageUrl" render={({ field }) => (
        <FormItem>
           <FormLabel>Image URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
          <FormControl><Input {...field} placeholder="https://..." /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      {form.watch("price") && form.watch("dailyEarnings") && form.watch("cycleDays") && (
        <div className="bg-primary/10 rounded-lg p-3 text-sm">
           <p className="text-muted-foreground">Estimated total return:</p>
          <p className="font-bold text-primary text-lg">
             {(parseInt(form.watch("dailyEarnings") || "0") * parseInt(form.watch("cycleDays") || "0")).toLocaleString()} PHP
          </p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-product">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{products?.length || 0} produit(s)</p>
        <Button onClick={() => { setShowCreateForm(true); createForm.reset(); }} data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {isLoading ? (
        Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
      ) : products && products.length > 0 ? (
        products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-contain border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.isFree && <Badge variant="secondary" className="text-xs">Gratuit</Badge>}
                      <Badge variant={product.isActive ? "default" : "outline"} className="text-xs">
                        {product.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                       {product.price.toLocaleString()} PHP — {product.dailyEarnings.toLocaleString()} PHP/day
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: product.id, isActive: checked })}
                    aria-label={product.isActive ? `Bloquer ${product.name}` : `Débloquer ${product.name}`}
                    title={product.isActive ? "Bloquer ce produit" : "Débloquer ce produit"}
                    data-testid={`switch-product-${product.id}`}
                  />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!product.isFree && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => { if (confirm(`Supprimer "${product.name}" ?`)) deleteMutation.mutate(product.id); }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix</p>
                   <p className="font-medium text-foreground">{product.price.toLocaleString()} PHP</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gains/jour</p>
                   <p className="font-medium text-foreground">{product.dailyEarnings.toLocaleString()} PHP</p>
                </div>
                <div>
                   <p className="text-muted-foreground">Total ({product.cycleDays} days)</p>
                   <p className="font-medium text-primary">{product.totalReturn.toLocaleString()} PHP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
           No products
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={(open) => { if (!open) { setShowCreateForm(false); createForm.reset(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <ProductFormFields form={createForm} isPending={createMutation.isPending} submitLabel="Créer" />
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier — {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
             Changes to price, earnings, or duration may also affect existing investments.
          </p>
          <Form {...editForm}>
            <ProductFormFields form={editForm} isPending={updateMutation.isPending} submitLabel="Enregistrer" />
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
