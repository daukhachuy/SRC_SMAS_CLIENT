import { resolveFoodImageUrl } from '../api/foodApi';
import { normalizeViKey } from './viCategoryMatch';

const CATEGORY_BY_ID = {
  1: 'Khai vị',
  2: 'Món chính',
  3: 'Tráng miệng',
  4: '\u0110\u1ED3 u\u1ED1ng',
};

/** Same as MenuPage: prefer categories[0].name and categoryId from API. */
export function categoryMetaFromApiFood(f) {
  const cats = f.categories || f.Categories;
  const first = Array.isArray(cats) && cats.length ? cats[0] : null;
  const rawName = String(first?.name ?? '').trim();
  const idRaw = first?.categoryId ?? first?.id ?? first?.CategoryId ?? f.categoryId ?? f.CategoryId;
  const catIds = f.categoryIds || f.CategoryIds;
  const fromArr = Array.isArray(catIds) && catIds.length ? catIds[0] : undefined;
  const id = Number(idRaw ?? fromArr);
  const categoryId = Number.isFinite(id) && id > 0 ? id : null;

  let categoryLabel = rawName;
  if (!categoryLabel && categoryId != null && CATEGORY_BY_ID[categoryId]) {
    categoryLabel = CATEGORY_BY_ID[categoryId];
  }
  if (!categoryLabel) categoryLabel = 'Món ăn';

  return { categoryId, categoryLabel };
}

export function collectCategoryIdsFromFood(f) {
  const seen = new Set();
  const out = [];
  const add = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };
  const idsArr = f.categoryIds || f.CategoryIds;
  if (Array.isArray(idsArr)) idsArr.forEach(add);
  const cats = f.categories || f.Categories;
  if (Array.isArray(cats)) {
    cats.forEach((c) => {
      if (!c) return;
      add(c.categoryId ?? c.CategoryId);
      add(c.id ?? c.Id);
    });
  }
  add(f.categoryId ?? f.CategoryId);
  return out;
}

export function mapFoodDtoToMenuOption(f) {
  const { categoryId, categoryLabel } = categoryMetaFromApiFood(f);
  return {
    type: 'Menu',
    id: f.foodId ?? f.id ?? 0,
    foodId: f.foodId ?? f.id ?? 0,
    name: f.foodName || f.name || '',
    price: f.price || 0,
    categoryId,
    categoryLabel,
    categoryIdCandidates: collectCategoryIdsFromFood(f),
    image: resolveFoodImageUrl(f.image ?? f.Image),
  };
}

/** Align dish categories with GET /category/lists. */
export function reconcileMenuItemsWithApiCategories(rawItems, menuCategoriesFromApi) {
  const nameToId = new Map();
  const idToName = new Map();
  (menuCategoriesFromApi || []).forEach((c) => {
    const name = String(c.name || '').trim();
    const idNum = c.categoryId != null ? Number(c.categoryId) : NaN;
    if (!name || !Number.isFinite(idNum)) return;
    const lower = name.toLowerCase();
    const norm = normalizeViKey(name);
    nameToId.set(lower, idNum);
    if (norm && norm !== lower) nameToId.set(norm, idNum);
    idToName.set(idNum, name);
  });

  return rawItems.map((o) => {
    if (o.type !== 'Menu') return o;

    const { categoryIdCandidates = [], ...restBase } = o;

    const rawLabel = String(o.categoryLabel || '').trim() || 'Món ăn';
    let categoryId = o.categoryId != null && Number.isFinite(Number(o.categoryId)) ? Number(o.categoryId) : null;
    let categoryLabel = rawLabel;

    const idFromLabel =
      nameToId.get(rawLabel.toLowerCase()) ?? nameToId.get(normalizeViKey(rawLabel));

    if (idFromLabel != null) {
      categoryId = idFromLabel;
      categoryLabel = idToName.get(idFromLabel) || rawLabel;
    } else if (categoryId != null && idToName.has(categoryId)) {
      categoryLabel = idToName.get(categoryId);
    }

    if (idToName.size > 0 && categoryIdCandidates.length) {
      const needsFix =
        categoryId == null || !idToName.has(categoryId) || categoryLabel === 'Món ăn';
      if (needsFix) {
        const hit = categoryIdCandidates.find((cand) => idToName.has(cand));
        if (hit != null) {
          categoryId = hit;
          categoryLabel = idToName.get(hit) || categoryLabel;
        }
      }
    }

    return { ...restBase, categoryId, categoryLabel };
  });
}
