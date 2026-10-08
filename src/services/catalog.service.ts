import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Category, 
  Product, 
  ProductVariant, 
  CatalogQueryFilters 
} from '@/types/catalog';
import { Result, ok, fail } from '@/types/result';

export interface ICatalogService {
  getCategories(): Promise<Result<readonly Category[]>>;
  getProducts(filters?: CatalogQueryFilters): Promise<Result<readonly Product[]>>;
  getProductBySlug(slug: string): Promise<Result<Product>>;
  getVariantById(variantId: string): Promise<Result<ProductVariant>>;
}

export class CatalogService implements ICatalogService {
  constructor(private readonly client: SupabaseClient) {}

  async getCategories(): Promise<Result<readonly Category[]>> {
    const { data, error } = await this.client
      .from('categories')
      .select('id, slug, name, description, parent_id, display_order, is_active, created_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      return fail(new Error(`Failed to fetch categories: ${error.message}`));
    }

    const categories: Category[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      parentId: row.parent_id ? String(row.parent_id) : null,
      displayOrder: Number(row.display_order ?? 0),
      isActive: Boolean(row.is_active),
      createdAt: String(row.created_at),
    }));

    return ok(categories);
  }

  async getProducts(filters?: CatalogQueryFilters): Promise<Result<readonly Product[]>> {
    let query = this.client
      .from('products')
      .select(`
        id, category_id, slug, name, brand, description, image_url,
        media_gallery, is_age_restricted, is_active, tags, display_order,
        category:categories!inner(id, slug, name, description, parent_id, display_order, is_active, created_at),
        variants:product_variants(id, product_id, sku, barcode, presentation_label, attributes, price_in_cents, compare_at_price_in_cents, is_active)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (filters?.categorySlug) {
      query = query.eq('category.slug', filters.categorySlug);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters?.limit) {
      const from = filters.offset ?? 0;
      query = query.range(from, from + filters.limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      return fail(new Error(`Failed to fetch products: ${error.message}`));
    }

    const products = (data ?? []).map((row: unknown) => this.mapProductRow(row as Record<string, unknown>));
    return ok(products);
  }

  async getProductBySlug(slug: string): Promise<Result<Product>> {
    const { data, error } = await this.client
      .from('products')
      .select(`
        id, category_id, slug, name, brand, description, image_url,
        media_gallery, is_age_restricted, is_active, tags, display_order,
        category:categories!inner(id, slug, name, description, parent_id, display_order, is_active, created_at),
        variants:product_variants(id, product_id, sku, barcode, presentation_label, attributes, price_in_cents, compare_at_price_in_cents, is_active)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return fail(new Error(`Product with slug '${slug}' not found`));
    }

    return ok(this.mapProductRow(data as Record<string, unknown>));
  }

  async getVariantById(variantId: string): Promise<Result<ProductVariant>> {
    const { data, error } = await this.client
      .from('product_variants')
      .select('id, product_id, sku, barcode, presentation_label, attributes, price_in_cents, compare_at_price_in_cents, is_active')
      .eq('id', variantId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return fail(new Error(`Variant '${variantId}' not found`));
    }

    return ok(this.mapVariantRow(data as Record<string, unknown>));
  }

  private mapProductRow(row: Record<string, unknown>): Product {
    const rawVariants = Array.isArray(row.variants) ? row.variants : [];
    const variants: ProductVariant[] = rawVariants.map((v: unknown) => 
      this.mapVariantRow(v as Record<string, unknown>)
    );

    return {
      id: String(row.id),
      categoryId: String(row.category_id),
      slug: String(row.slug),
      name: String(row.name),
      brand: row.brand ? String(row.brand) : null,
      description: row.description ? String(row.description) : null,
      imageUrl: row.image_url ? String(row.image_url) : null,
      mediaGallery: Array.isArray(row.media_gallery) ? (row.media_gallery as string[]) : [],
      isAgeRestricted: Boolean(row.is_age_restricted),
      isActive: Boolean(row.is_active),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      displayOrder: Number(row.display_order ?? 0),
      variants,
    };
  }

  private mapVariantRow(row: Record<string, unknown>): ProductVariant {
    return {
      id: String(row.id),
      productId: String(row.product_id),
      sku: String(row.sku),
      barcode: row.barcode ? String(row.barcode) : null,
      presentationLabel: String(row.presentation_label),
      attributes: (row.attributes as Record<string, unknown>) ?? {},
      priceInCents: Number(row.price_in_cents),
      compareAtPriceInCents: row.compare_at_price_in_cents ? Number(row.compare_at_price_in_cents) : null,
      isActive: Boolean(row.is_active),
    };
  }
}
