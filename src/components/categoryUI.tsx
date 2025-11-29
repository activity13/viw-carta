"use client";
import { useEffect, useState } from "react";
import Axios from "axios";
import { Loader2, Plus, Trash2, Edit2, Save } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  code: number;
  slug: string;
  description?: string;
  restaurantId: string;
  isActive?: boolean;
  order?: number;
}

export default function CategoryUI({ restaurantId }: { restaurantId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    slug: "",
    description: "",
    order: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await Axios.get("/api/categories/get", {
        params: { restaurantId },
      });
      setCategories(res.data);
    } catch (error) {
      // Manejo de error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (restaurantId) fetchCategories();
  }, [restaurantId]);

  // Create category
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Axios.post("/api/categories/create", {
        ...form,
        code: Number(form.code),
        restaurantId,
      });
      setForm({
        name: "",
        code: "",
        slug: "",
        description: "",
        order: 0,
      });
      fetchCategories();
    } catch (error) {
      // Manejo de error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await Axios.delete("/api/categories/delete", {
        data: { id, restaurantId },
      });
      fetchCategories();
    } catch (error) {
      // Manejo de error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Edit category
  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setEditForm({
      name: cat.name,
      code: cat.code,
      slug: cat.slug,
      description: cat.description,
      order: cat.order,
    });
  };

  // Save edit
  const handleSaveEdit = async (id: string) => {
    setLoading(true);
    try {
      await Axios.put("/api/categories/update", {
        id,
        ...editForm,
        code: Number(editForm.code),
        restaurantId,
      });
      setEditingId(null);
      setEditForm({});
      fetchCategories();
    } catch (error) {
      // Manejo de error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-24">
      <div className="max-w-2xl mx-auto bg-green-950/90 border-2 border-green-900 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Categorías</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono"
            />
            <input
              type="text"
              placeholder="Código"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              required
              className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono"
            />
            <input
              type="text"
              placeholder="ejemplo-de-slug-aqui"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
              className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono"
            />
            <input
              type="number"
              placeholder="Orden"
              value={form.order}
              onChange={(e) =>
                setForm((f) => ({ ...f, order: Number(e.target.value) }))
              }
              required
              className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono"
            />
            <input
              type="text"
              placeholder="Descripción"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="bg-green-900/80 border border-green-700 text-white placeholder:text-green-300 rounded-xl px-4 py-2 font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-900 via-green-800 to-green-700 border-2 border-green-300 text-yellow-300 font-bold text-lg px-6 py-2 rounded-xl shadow-lg tracking-wide uppercase hover:bg-green-700 hover:text-white hover:border-yellow-300 transition-all duration-150 flex items-center gap-2"
            disabled={loading}
          >
            <Plus className="w-5 h-5" />
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Agregar"}
          </button>
        </form>
        <div className="space-y-3">
          {categories.length === 0 && (
            <p className="text-green-300 text-center">
              No hay categorías registradas.
            </p>
          )}
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between bg-green-900/80 border border-green-700 rounded-xl px-4 py-3 text-white font-mono"
            >
              {editingId === cat._id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-1 gap-2">
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="bg-green-950 border border-green-700 text-white rounded px-2 py-1"
                  />
                  <input
                    type="number"
                    id="order"
                    value={editForm.code?.toString() || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        code: Number(e.target.value),
                      }))
                    }
                    className="bg-green-950 border border-green-700 text-white rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={editForm.slug || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className="bg-green-950 border border-green-700 text-white rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={editForm.order || 0}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        order: Number(e.target.value),
                      }))
                    }
                    className="bg-green-950 border border-green-700 text-white rounded px-2 py-1"
                  />
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    className="bg-green-950 border border-green-700 text-white rounded px-2 py-1 md:h-24 w-full resize-none overflow-y-auto leading-tight"
                  />
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <span className="font-bold">{cat.name}</span>
                  <span className="text-green-300">Código: {cat.code}</span>
                  <span className="text-green-300">Slug: {cat.slug}</span>
                  <span className="text-green-300">Orden: {cat.order}</span>
                  {cat.description && (
                    <span className="text-green-300">{cat.description}</span>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-2 px-4 md:mt-0">
                {editingId === cat._id ? (
                  <button
                    onClick={() => handleSaveEdit(cat._id)}
                    className="bg-yellow-300 text-green-900 rounded px-2 py-1 font-bold flex items-center gap-1 hover:bg-yellow-400 transition"
                    disabled={loading}
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(cat)}
                    className="bg-green-700 text-white rounded px-2 py-1 font-bold flex items-center gap-1 hover:bg-green-800 transition"
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="bg-red-700 text-white rounded px-2 py-1 font-bold flex items-center gap-1 hover:bg-red-800 transition"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
