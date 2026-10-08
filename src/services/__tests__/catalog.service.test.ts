import { CatalogService } from '../catalog.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('CatalogService (Unit Tests with Inversion of Control)', () => {
  let mockSupabase: {
    from: jest.Mock;
  };
  let service: CatalogService;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
    };
    service = new CatalogService(mockSupabase as unknown as SupabaseClient);
  });

  describe('getCategories', () => {
    it('should return active categories ordered by displayOrder', async () => {
      // Arrange
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

      // Act
      const result = await service.getCategories();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('cat-1');
        expect(result.data[0].slug).toBe('whisky');
        expect(result.data[0].name).toBe('Whisky');
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
      expect(mockQueryChain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return failure result when database throws an error', async () => {
      // Arrange
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB connection failure' } }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      // Act
      const result = await service.getCategories();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('DB connection failure');
      }
    });
  });

  describe('getProducts', () => {
    it('should return mapped products with variants', async () => {
      // Arrange
      const mockProductsData = [
        {
          id: 'prod-1',
          category_id: 'cat-1',
          slug: 'johnnie-walker-black',
          name: 'Johnnie Walker Black',
          brand: 'Johnnie Walker',
          description: '12 Years Scotch Whisky',
          image_url: 'https://images.partyflow.app/jw.jpg',
          media_gallery: ['https://images.partyflow.app/jw.jpg'],
          is_age_restricted: true,
          is_active: true,
          tags: ['whisky', 'party'],
          display_order: 1,
          variants: [
            {
              id: 'var-1',
              product_id: 'prod-1',
              sku: 'SKU-JW-750',
              barcode: '7701234567890',
              presentation_label: '750ml',
              attributes: { volume_ml: 750 },
              price_in_cents: 18500000,
              cost_in_cents: 14000000,
              compare_at_price_in_cents: 20000000,
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

      // Act
      const result = await service.getProducts();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        const product = result.data[0];
        expect(product.name).toBe('Johnnie Walker Black');
        expect(product.variants).toHaveLength(1);
        expect(product.variants?.[0].sku).toBe('SKU-JW-750');
        expect(product.variants?.[0].priceInCents).toBe(18500000);
      }
    });
  });

  describe('getProductBySlug', () => {
    it('should return product details when found', async () => {
      // Arrange
      const mockProductData = {
        id: 'prod-2',
        category_id: 'cat-2',
        slug: 'don-julio-70',
        name: 'Don Julio 70',
        brand: 'Don Julio',
        description: 'Añejo Cristalino Tequila',
        image_url: null,
        media_gallery: [],
        is_age_restricted: true,
        is_active: true,
        tags: ['tequila'],
        display_order: 2,
        variants: [],
      };

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProductData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      // Act
      const result = await service.getProductBySlug('don-julio-70');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('don-julio-70');
      }
    });

    it('should return error when slug is not found', async () => {
      // Arrange
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      // Act
      const result = await service.getProductBySlug('non-existent');

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('not found');
      }
    });
  });

  describe('getVariantById', () => {
    it('should return variant when id exists', async () => {
      // Arrange
      const mockVariantData = {
        id: 'var-99',
        product_id: 'prod-99',
        sku: 'SKU-TEST',
        barcode: null,
        presentation_label: 'Pack x 6',
        attributes: { pack_size: 6 },
        price_in_cents: 3500000,
        cost_in_cents: 2500000,
        compare_at_price_in_cents: null,
        is_active: true,
      };

      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockVariantData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryChain);

      // Act
      const result = await service.getVariantById('var-99');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('var-99');
        expect(result.data.presentationLabel).toBe('Pack x 6');
      }
    });
  });
});
