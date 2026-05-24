'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';

interface FoodData {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string;
  servingUnit: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function EditFoodPage() {
  const router = useRouter();
  const params = useParams();
  const foodId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    servingSize: '',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  useEffect(() => {
    fetchFood();
  }, [foodId]);

  async function fetchFood() {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/foods/${foodId}`);

      if (!response.ok) {
        throw new Error('Food not found');
      }

      const food: FoodData = await response.json();

      setFormData({
        name: food.name,
        brand: food.brand || '',
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.nutrition.calories.toString(),
        protein: food.nutrition.protein.toString(),
        carbs: food.nutrition.carbs.toString(),
        fat: food.nutrition.fat.toString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load food');
    } finally {
      setFetchLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand || null,
          servingSize: formData.servingSize,
          servingUnit: formData.servingUnit,
          calories: parseFloat(formData.calories),
          protein: parseFloat(formData.protein),
          carbs: parseFloat(formData.carbs),
          fat: parseFloat(formData.fat),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update food');
      }

      router.push('/foods');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) {
    return (
      <AppLayout>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Food
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow sm:rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            {/* Serving Size */}
            <div>
              <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700">
                Serving Size *
              </label>
              <input
                type="text"
                name="servingSize"
                id="servingSize"
                required
                value={formData.servingSize}
                onChange={handleChange}
                placeholder="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            {/* Serving Unit */}
            <div>
              <label htmlFor="servingUnit" className="block text-sm font-medium text-gray-700">
                Serving Unit *
              </label>
              <select
                name="servingUnit"
                id="servingUnit"
                required
                value={formData.servingUnit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              >
                <option value="g">grams (g)</option>
                <option value="oz">ounces (oz)</option>
                <option value="ml">milliliters (ml)</option>
                <option value="cup">cup</option>
                <option value="tbsp">tablespoon (tbsp)</option>
                <option value="tsp">teaspoon (tsp)</option>
                <option value="piece">piece</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nutrition Information</h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Calories */}
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
                  Calories *
                </label>
                <input
                  type="number"
                  name="calories"
                  id="calories"
                  required
                  min="0"
                  step="1"
                  value={formData.calories}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Protein */}
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                  Protein (g) *
                </label>
                <input
                  type="number"
                  name="protein"
                  id="protein"
                  required
                  min="0"
                  step="0.1"
                  value={formData.protein}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Carbs */}
              <div>
                <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                  Carbs (g) *
                </label>
                <input
                  type="number"
                  name="carbs"
                  id="carbs"
                  required
                  min="0"
                  step="0.1"
                  value={formData.carbs}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Fat */}
              <div>
                <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
                  Fat (g) *
                </label>
                <input
                  type="number"
                  name="fat"
                  id="fat"
                  required
                  min="0"
                  step="0.1"
                  value={formData.fat}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Link
              href="/foods"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
