import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, config = {}) => {
        const quantity = Math.max(1, Number(config.quantity) || 1);
        const measurements = config.measurements || {};
        const attachments = config.attachments || [];
        const note = config.note || '';
        set((state) => {
          const existingItem = state.items.find(item => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? {
                      ...item,
                      quantity: item.quantity + quantity,
                      specs: item.specs?.length ? item.specs : product.specs || [],
                      measurements: { ...(item.measurements || {}), ...measurements },
                      attachments: [...(item.attachments || []), ...attachments],
                      note: note || item.note,
                    }
                  : item
              )
            };
          }
          return {
            items: [...state.items, { 
              id: product.id, 
              slug: product.slug, // lets the enquiry inbox link to the product
              name: product.name, 
              category: product.categoryLabel, 
              image: product.images[0],
              specs: product.specs || [],
              measurements,
              attachments,
              quantity, 
              note 
            }]
          };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      updateNote: (id, note) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, note } : item
          )
        }));
      },

      updateMeasurement: (id, key, value) => {
        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, measurements: { ...(item.measurements || {}), [key]: value } }
              : item
          )
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'indus-enquiry-cart',
    }
  )
);
