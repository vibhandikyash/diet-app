'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string;
  servingUnit: string;
  nutrition: NutritionData;
}

interface SelectedFood {
  foodItemId: string;
  quantity: number;
  food: FoodItem;
}

export default function NewMealPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [mealDate, setMealDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFoods();
  }, []);

  async function fetchFoods() {
    try {
      setLoading(true);
      const response = await fetch('/api/foods?page=1&limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch foods');
      }

      const data = await response.json();
      setFoods(data.foods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function addFoodToMeal() {
    if (!selectedFoodId) {
      alert('Please select a food item');
      return;
    }

    const food = foods.find(f => f.id === selectedFoodId);
    if (!food) {
      alert('Food item not found');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setSelectedFoods([
      ...selectedFoods,
      {
        foodItemId: selectedFoodId,
        quantity: qty,
        food,
      },
    ]);

    // Reset selection
    setSelectedFoodId('');
    setQuantity('1');
  }

  function removeFoodFromMeal(index: number) {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  }

  function calculateTotals() {
    return selectedFoods.reduce(
      (totals, item) => {
        const nutrition = item.food.nutrition;
        return {
          calories: totals.calories + nutrition.calories * item.quantity,
          protein: totals.protein + nutrition.protein * item.quantity,
          carbs: totals.carbs + nutrition.carbs * item.quantity,
          fat: totals.fat + nutrition.fat * item.quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!session?.user) {
      alert('You must be logged in to create a meal');
      return;
    }

    if (!mealName.trim()) {
      alert('Please enter a meal name');
      return;
    }

    if (selectedFoods.length === 0) {
      alert('Please add at least one food item');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userId = (session.user as any).id;

      if (!userId) {
        throw new Error('User ID not found in session');
      }

      const mealData = {
        userId,
        name: mealName.trim(),
        mealType,
        date: new Date(mealDate).toISOString(),
        notes: notes.trim() || null,
        foodItems: selectedFoods.map(item => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          servingSize: 'serving',
        })),
      };

      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meal');
      }

      router.push('/meals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meal');
    } finally {
      setSaving(false);
    }
  }

  const totals = calculateTotals();

  if (loading) {
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
            <h1 className="text-2xl font-semibold text-gray-900">Log New Meal</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meal Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Meal Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mealName" className="block text-sm font-medium text-gray-700">
                  Meal Name *
                </label>
                <input
                  type="text"
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-gray-700">
                  Meal Type *
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label htmlFor="mealDate" className="block text-sm font-medium text-gray-700">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="mealDate"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Add Food Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add Food Items</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="foodSelect" className="block text-sm font-medium text-gray-700">
                  Select Food
                </label>
                <select
                  id="foodSelect"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Choose a food...</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} {food.brand ? `(${food.brand})` : ''} - {food.servingSize} {food.servingUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Servings
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addFoodToMeal}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Food
            </button>
          </div>

          {/* Selected Foods */}
          {selectedFoods.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Foods</h2>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Food
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Servings
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Calories
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Protein (g)
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Carbs (g)
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Fat (g)
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedFoods.map((item, index) => {
                      const nutrition = item.food.nutrition;
                      return (
                        <tr key={index}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            {item.food.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {(nutrition.calories * item.quantity).toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {(nutrition.protein * item.quantity).toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {(nutrition.carbs * item.quantity).toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {(nutrition.fat * item.quantity).toFixed(1)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              onClick={() => removeFoodFromMeal(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                        Totals
                      </td>
                      <td></td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                        {totals.calories.toFixed(1)}
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                        {totals.protein.toFixed(1)}
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                        {totals.carbs.toFixed(1)}
                      </td>
                      <td className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                        {totals.fat.toFixed(1)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/meals')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || selectedFoods.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Meal'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
