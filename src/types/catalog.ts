export type CategoryId = string;
export type ProductId = string;
export type VariantId = string;
export type WarehouseId = string;

export interface Category {
  readonly id: CategoryId;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: CategoryId | null;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
}

export interface ProductVariant {
  readonly id: VariantId;
  readonly productId: ProductId;
  readonly sku: string;
  readonly barcode: string | null;
  readonly presentationLabel: string;
  readonly attributes: Record<string, unknown>;
  readonly priceInCents: number;
  readonly costInCents: number;
  readonly compareAtPriceInCents: number | null;
  readonly isActive: boolean;
}

export interface Product {
  readonly id: ProductId;
  readonly categoryId: CategoryId;
  readonly slug: string;
  readonly name: string;
  readonly brand: string | null;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly mediaGallery: readonly string[];
  readonly isAgeRestricted: boolean;
  readonly isActive: boolean;
  readonly tags: readonly string[];
  readonly displayOrder: number;
  readonly variants?: readonly ProductVariant[];
  readonly category?: Category;
}

export interface Warehouse {
  readonly id: WarehouseId;
  readonly code: string;
  readonly name: string;
  readonly address: string;
  readonly isActive: boolean;
}

export interface CatalogQueryFilters {
  readonly categorySlug?: string;
  readonly search?: string;
  readonly isAgeRestricted?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}
