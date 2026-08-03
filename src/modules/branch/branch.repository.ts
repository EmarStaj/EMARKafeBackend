import { supabaseAdmin } from '../../config/supabase';

export interface Branch {
  id?: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  opening_hours?: any;
  is_active?: boolean;
}

export class BranchRepository {
  /**
   * Fetch all branches.
   */
  async getAllBranches(onlyActive = true) {
    let query = supabaseAdmin.from('branches').select('*');
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  /**
   * Fetch a single branch by ID.
   */
  async getBranchById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new branch.
   */
  async createBranch(branch: Branch) {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .insert(branch)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing branch.
   */
  async updateBranch(id: string, branch: Partial<Branch>) {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .update(branch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a branch.
   */
  async deleteBranch(id: string) {
    const { error } = await supabaseAdmin
      .from('branches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get product stock list / availability for a specific branch.
   * Returns all active products with their availability status at this branch (defaults to true if not explicitly disabled).
   */
  async getBranchProducts(branchId: string) {
    const { data: allProducts, error: prodError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        base_price,
        image_url,
        is_active,
        category_id,
        categories (
          id,
          name,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (prodError) throw prodError;

    const { data: branchStock, error: stockError } = await supabaseAdmin
      .from('branch_products')
      .select('product_id, is_available, updated_at, updated_by')
      .eq('branch_id', branchId);

    if (stockError) throw stockError;

    const stockMap = new Map<string, any>();
    branchStock?.forEach(item => {
      stockMap.set(item.product_id, item);
    });

    return (allProducts || []).map(prod => {
      const stockItem = stockMap.get(prod.id);
      return {
        product_id: prod.id,
        branch_id: branchId,
        is_available: stockItem ? stockItem.is_available : true,
        updated_at: stockItem ? stockItem.updated_at : null,
        updated_by: stockItem ? stockItem.updated_by : null,
        products: prod
      };
    });
  }

  /**
   * Update or insert product availability mapping for a branch.
   */
  async updateBranchProductAvailability(
    branchId: string,
    productId: string,
    isAvailable: boolean,
    updatedBy: string
  ) {
    // Check if entry already exists to fetch its ID, or perform upsert on unique keys (branch_id, product_id)
    // Supabase supports upserts matching unique constraints
    const { data, error } = await supabaseAdmin
      .from('branch_products')
      .upsert({
        branch_id: branchId,
        product_id: productId,
        is_available: isAvailable,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id,product_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
