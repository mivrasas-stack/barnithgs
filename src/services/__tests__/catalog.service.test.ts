import { CatalogService } from '../catalog.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('CatalogService (Unit Tests)', () => {
  let mockSupabase: { from: jest.Mock };
  let service: CatalogService;

  beforeEach(() => {
    mockSupabase = { from: jest.fn() };
    service = new CatalogService(mockSupabase as unknown as SupabaseClient);
  });

  describe('getCategories', () => {
    it('should return active categories ordered by displayOrder', async () => {
      const mockCategoriesData = [
        {
          id: 'cat-1',
          slug: 'whisky',
          name: 'Whisky',
          description: 'Destilados premium',
          parent_id: null,
          display_order: 1,
          is_active: true,
          created_at: '2026-10-08T00:00:00Z',
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockCategoriesData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await service.getCategories();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].slug).toBe('whisky');
      }
    });
  });

  describe('getProducts', () => {
    it('should query products without exposing cost_in_cents', async () => {
      const mockProductsData = [
        {
          id: 'prod-1',
          category_id: 'cat-1',
          slug: 'johnnie-walker-black',
          name: 'Johnnie Walker Black',
          brand: 'Johnnie Walker',
          description: null,
          image_url: null,
          media_gallery: [],
          is_age_restricted: true,
          is_active: true,
          tags: ['whisky'],
          display_order: 1,
          variants: [
            {
              id: 'var-1',
              product_id: 'prod-1',
              sku: 'SKU-JW-750',
              barcode: null,
              presentation_label: '750ml',
              attributes: {},
              price_in_cents: 18500000,
              compare_at_price_in_cents: null,
              is_active: true,
            },
          ],
        },
      ];

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: (val: unknown) => void) => resolve({ data: mockProductsData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await service.getProducts();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        const variant = result.data[0].variants?.[0];
        expect(variant?.sku).toBe('SKU-JW-750');
        expect(variant).not.toHaveProperty('costInCents');
        expect(variant).not.toHaveProperty('cost_in_cents');
      }
      // Verify query select statement does NOT request cost_in_cents
      const selectCall = mockQueryChain.select.mock.calls[0][0];
      expect(selectCall).not.toContain('cost_in_cents');
    });

    it('should apply category filter, search, and pagination range', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: (resolve: (val: unknown) => void) => resolve({ data: [], error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      await service.getProducts({
        categorySlug: 'tequila',
        search: 'don julio',
        limit: 10,
        offset: 20,
      });

      expect(mockQueryChain.eq).toHaveBeenCalledWith('category.slug', 'tequila');
      expect(mockQueryChain.ilike).toHaveBeenCalledWith('name', '%don julio%');
      expect(mockQueryChain.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('getProductBySlug', () => {
    it('should return product details when found', async () => {
      const mockProductData = {
        id: 'prod-2',
        category_id: 'cat-2',
        slug: 'don-julio-70',
        name: 'Don Julio 70',
        brand: 'Don Julio',
        description: null,
        image_url: null,
        media_gallery: [],
        is_age_restricted: true,
        is_active: true,
        tags: [],
        display_order: 1,
        variants: [],
      };

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProductData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await service.getProductBySlug('don-julio-70');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('don-julio-70');
      }
    });
  });

  describe('getVariantById', () => {
    it('should return variant without cost_in_cents', async () => {
      const mockVariantData = {
        id: 'var-10',
        product_id: 'prod-10',
        sku: 'SKU-VODKA',
        barcode: null,
        presentation_label: '1L',
        attributes: {},
        price_in_cents: 9500000,
        compare_at_price_in_cents: null,
        is_active: true,
      };

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockVariantData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      const result = await service.getVariantById('var-10');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('var-10');
        expect(result.data).not.toHaveProperty('costInCents');
      }
      expect(mockQueryChain.select.mock.calls[0][0]).not.toContain('cost_in_cents');
    });
  });
});
