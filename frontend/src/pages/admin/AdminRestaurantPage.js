import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Pencil, X, Eye, Bell, Trash2, User, Share2, FileImage } from 'lucide-react';
import { discountAPI } from '../../api/discountApi';
import { blogAPI } from '../../api/blogApi';
import { feedbackAPI } from '../../api/feedbackApi';
import { serviceAPI } from '../../api/serviceApi';
import { EVENT_TYPES_LIST } from '../../api/managerApi';
import { eventsAPI } from '../../api/eventsApi';
import '../../styles/AdminRestaurant.css';

/** API BlogResponse dùng `fullname` (Swagger); hỗ trợ fullName, author lồng nhau */
function pickBlogAuthorName(b) {
  if (!b || typeof b !== 'object') return '';
  const nested = b.author && typeof b.author === 'object'
    ? (b.author.fullname ?? b.author.fullName ?? b.author.name)
    : null;
  const v = b.fullname ?? b.fullName ?? b.FullName ?? b.authorName ?? nested;
  const s = v != null ? String(v).trim() : '';
  return s;
}

/** Đường dẫn ảnh bìa từ API (chi tiết / danh sách có thể khác tên field) */
function pickBlogImagePath(b) {
  if (!b || typeof b !== 'object') return '';
  const p = b.image ?? b.thumbnail ?? b.imageUrl ?? b.coverUrl ?? b.coverImage ?? b.Image;
  if (p == null || p === '') return '';
  return String(p).trim();
}

function mapApiBlogToRow(b) {
  const published = b.publishedAt || b.createdAt;
  const d = published ? new Date(published) : null;
  const dateStr = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : '';
  const publishedLike = String(b.status || '').toLowerCase() === 'published';
  const author = pickBlogAuthorName(b);
  return {
    id: b.blogId,
    title: b.title || '',
    author: author || '—',
    date: dateStr,
    views: Number(b.viewCount) || 0,
    on: publishedLike,
    content: b.content || '',
    image: pickBlogImagePath(b) || '',
    expireDate: '',
    category: '',
    raw: b,
  };
}

function mapApiServiceToRow(s) {
  const rawPrice = s.servicePrice ?? s.price;
  const priceVal = Number(rawPrice);
  const formatted = Number.isFinite(priceVal) ? priceVal.toLocaleString('vi-VN') + ' VNĐ' : '—';
  const imagePath = s.imageUrl || s.image || s.thumbnail || s.coverImage || '';
  const name = (s.title || s.name || '').trim();
  const active = s.isAvailable != null ? Boolean(s.isAvailable) : Boolean(s.active);
  return {
    id: s.serviceId,
    name,
    price: formatted,
    unit: s.unit || '',
    description: s.description || '',
    active,
    imageUrl: imagePath ? resolveBlogImageUrl(imagePath) : '',
    raw: s,
  };
}

/** Ánh xạ 1 event từ API → row cho bảng */
function mapApiEventToRow(e) {
  const typeMap = {
    Wedding: 'Tiệc Cưới',
    Conference: 'Hội Nghị - Hội Thảo',
    Birthday: 'Sinh Nhật',
    Corporate: 'Tiệc Công Ty',
    Family: 'Liên Hoan Gia Đình',
  };
  const rawType = (e.eventType || '').trim();
  const typeLabel = typeMap[rawType] || rawType || '—';
  const imagePath = e.imageUrl || e.image || e.thumbnail || e.coverImage || '';
  const priceVal = Number(e.basePrice ?? e.price);
  const priceFormatted = Number.isFinite(priceVal) && priceVal > 0 ? priceVal.toLocaleString('vi-VN') + ' VNĐ' : '—';
  return {
    id: e.eventId,
    title: e.title || '',
    eventType: typeLabel,
    eventTypeKey: rawType,
    description: e.description || '',
    price: priceFormatted,
    imageUrl: imagePath ? resolveBlogImageUrl(imagePath) : '',
    active: e.isActive != null ? Boolean(e.isActive) : true,
    raw: e,
  };
}

function emptyEventForm() {
  return {
    title: '',
    description: '',
    eventType: 'Wedding',
    image: '',
    price: '',
    isActive: true,
  };
}

function mapApiFeedbackToRow(f) {
  const id = f.feedbackId;
  const name = (f.fullname || '').trim() || 'Khách';
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0] || '?').slice(0, 2).toUpperCase();
  const rating = Number(f.rating);
  const stars = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 0;
  const created = f.createdAt ? new Date(f.createdAt) : null;
  const timeStr = created && !Number.isNaN(created.getTime()) ? created.toLocaleString('vi-VN') : '—';
  let avatarUrl = (f.avatar || '').trim();
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    avatarUrl = resolveBlogImageUrl(avatarUrl);
  }
  return {
    id,
    name,
    initials,
    stars,
    comment: f.comment || '',
    time: timeStr,
    avatarUrl,
    raw: f,
  };
}

function computeFeedbackSummary(rows) {
  const n = rows.length;
  if (!n) {
    return {
      avg: null,
      countText: '0 phản hồi',
      starsVisual: '—',
      bars: [0, 0, 0, 0, 0],
      positivePct: 0,
      negativePct: 0,
    };
  }
  let sum = 0;
  let rated = 0;
  const dist = [0, 0, 0, 0, 0];
  rows.forEach((r) => {
    const s = Number(r.stars);
    if (Number.isFinite(s) && s >= 1 && s <= 5) {
      sum += s;
      rated += 1;
      dist[s - 1] += 1;
    }
  });
  const avg = rated ? sum / rated : null;
  const bars = dist.map((c) => (n ? Math.round((c / n) * 100) : 0));
  const low = dist[0] + dist[1];
  const high = dist[3] + dist[4];
  const positivePct = n ? Math.round((high / n) * 100) : 0;
  const negativePct = n ? Math.round((low / n) * 100) : 0;
  let starsVisual = '—';
  if (avg != null) {
    const full = Math.floor(avg);
    const half = avg - full >= 0.5;
    starsVisual = `${'★'.repeat(full)}${half ? '½' : ''}`;
  }
  return {
    avg,
    countText: `${n} phản hồi`,
    starsVisual,
    bars,
    positivePct,
    negativePct,
  };
}

function parseMoneyInput(s) {
  if (s == null || s === '') return 0;
  const n = parseFloat(String(s).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function getCreatedByUserId() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      const id = Number(u.userId ?? u.id);
      return Number.isFinite(id) && id > 0 ? id : null;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function deriveDiscountStatus(startDate, endDate) {
  const end = new Date(endDate);
  const start = new Date(startDate);
  const now = new Date();
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime())) return 'running';
  if (now > end) return 'expired';
  if (now < start) return 'upcoming';
  return 'running';
}

const API_BASE_FOR_ASSETS = (process.env.REACT_APP_API_URL || 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api').replace(/\/$/, '');

function apiOriginFromBase(apiBase) {
  return String(apiBase).replace(/\/api\/?$/i, '');
}

function resolveBlogImageUrl(image) {
  if (image == null || image === '') return '';
  const s = String(image).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const origin = apiOriginFromBase(API_BASE_FOR_ASSETS);
  return `${origin}${s.startsWith('/') ? s : `/${s}`}`;
}

/** URL hiển thị preview trong form (blob / https / đường dẫn tương đối) */
function blogFormImageDisplaySrc(preview, imageField) {
  if (preview) return preview;
  const s = (imageField || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return resolveBlogImageUrl(s) || s;
}

function formatBlogDateTime(iso) {
  if (iso == null || iso === '') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN');
}

function toDatetimeLocalValue(d) {
  const x = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

/**
 * API trả 400 nếu publishedAt trong quá khứ (vd: "PublishedAt cannot be in the past").
 * Gửi max(thời điểm form, hiện tại).
 */
function publishedAtToIsoForApi(datetimeLocalValue) {
  const now = new Date();
  const parsed = datetimeLocalValue ? new Date(datetimeLocalValue) : now;
  const t = Number.isNaN(parsed.getTime()) ? now : parsed;
  return (t < now ? now : t).toISOString();
}

/** PUT /api/blogs/{id} — đổi status khi PATCH bị 403 (backend thường chỉ cho PUT đầy đủ BlogUpdateDto) */
function buildBlogPutPayloadForStatusChange(row, nextStatus, detailFromApi) {
  const r = detailFromApi && typeof detailFromApi === 'object' ? detailFromApi : (row.raw || {});
  const title = (r.title ?? row.title ?? '').trim();
  const content = (r.content != null ? String(r.content) : (row.content != null ? String(row.content) : '')).trim();
  if (!title) throw new Error('Thiếu tiêu đề blog');
  if (!content) throw new Error('Thiếu nội dung blog — không thể cập nhật trạng thái');
  const image = (r.image ?? row.image ?? '').trim();
  const vc = Number(r.viewCount ?? row.views ?? 0);
  const publishedAtSource = r.publishedAt || r.createdAt;
  const dtLocal = publishedAtSource
    ? toDatetimeLocalValue(new Date(publishedAtSource))
    : toDatetimeLocalValue(new Date());
  const publishedAt = publishedAtToIsoForApi(dtLocal);
  return {
    title,
    content,
    image: image || '',
    viewCount: Number.isFinite(vc) && vc >= 0 ? vc : 0,
    status: nextStatus,
    publishedAt,
  };
}

function emptyBlogForm() {
  return {
    title: '',
    content: '',
    image: '', // đường dẫn Cloudinary (string) sau khi upload
    status: 'Published',
    publishedAt: toDatetimeLocalValue(new Date()),
  };
}

function emptyServiceForm() {
  return {
    title: '',
    servicePrice: '',
    description: '',
    unit: '',
    image: '',
    isAvailable: true,
  };
}

/** Cloudinary upload – dùng preset & folder có sẵn trong dự án */
const CLOUD_BLOG = {
  cloudName: 'dmzuier4p',
  uploadPreset: 'Image_profile',
  folder: 'image_SEP490/blogs',
};

const CLOUD_SERVICE = {
  cloudName: 'dmzuier4p',
  uploadPreset: 'Image_profile',
  folder: 'image_SEP490/services',
};

async function uploadBlogImageToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUD_BLOG.uploadPreset);
  fd.append('folder', CLOUD_BLOG.folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_BLOG.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  const json = await res.json();
  return json.secure_url;
}

async function uploadServiceImageToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUD_SERVICE.uploadPreset);
  fd.append('folder', CLOUD_SERVICE.folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_SERVICE.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('Upload ảnh thất bại');
  const json = await res.json();
  return json.secure_url;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

function revokeBlogPreviewIfBlob(url) {
  if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url);
}

function handleBlogImageChange(file, setBlogForm, setBlogImageFile, setBlogImagePreview) {
  if (!file) return;
  if (file.size > MAX_IMAGE_SIZE) {
    window.alert('File tối đa 5MB. Vui lòng chọn ảnh nhẹ hơn.');
    return;
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    window.alert('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF.');
    return;
  }
  const preview = URL.createObjectURL(file);
  setBlogImageFile(file);
  setBlogImagePreview(preview);
  setBlogForm((f) => ({ ...f, image: '' })); // xóa URL cũ, chờ upload
}

function blogContentLooksLikeHtml(s) {
  return typeof s === 'string' && /<[a-z][\s\S]*>/i.test(s);
}

function blogRowFromDetail(d) {
  if (!d || typeof d !== 'object') return null;
  const published = d.publishedAt || d.createdAt;
  const dt = published ? new Date(published) : null;
  const dateStr = dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleDateString('vi-VN') : '';
  return {
    id: d.blogId,
    title: d.title || '',
    author: pickBlogAuthorName(d) || '—',
    date: dateStr,
    views: Number(d.viewCount) || 0,
    on: String(d.status || '').toLowerCase() === 'published',
    content: d.content || '',
    image: d.image || '',
    expireDate: '',
    category: '',
    raw: d,
  };
}

const BLOG_DETAIL_KNOWN_KEYS = new Set([
  'blogId', 'title', 'content', 'image', 'viewCount', 'status',
  'createdAt', 'updatedAt', 'publishedAt', 'fullname', 'fullName', 'FullName', 'authorName', 'authorId',
]);

function mapApiDiscountToRow(d) {
  const dt = d.discountType;
  const isPct = dt === 'Percentage';
  const isShip = String(d.applicableFor || '').toLowerCase() === 'shipping';
  const typeLabel = isPct ? 'Phần trăm (%)' : isShip ? 'Vận chuyển' : 'Cố định (VNĐ)';
  let valueDisplay;
  if (isPct) valueDisplay = `${d.value}% Giảm giá`;
  else if (isShip) valueDisplay = 'Miễn phí vận chuyển';
  else valueDisplay = `${Number(d.value).toLocaleString('vi-VN')}đ Giảm`;
  return {
    id: d.discountId,
    code: d.code,
    type: typeLabel,
    value: valueDisplay,
    start: d.startDate ? new Date(d.startDate).toLocaleDateString('vi-VN') : '',
    end: d.endDate ? new Date(d.endDate).toLocaleDateString('vi-VN') : '',
    status: deriveDiscountStatus(d.startDate, d.endDate),
    raw: d,
  };
}

const AdminRestaurantPage = () => {
  const [tab, setTab] = useState('codes');
  const [codeSearch, setCodeSearch] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codesLoadError, setCodesLoadError] = useState('');
  const [codeSubmitError, setCodeSubmitError] = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsLoadError, setBlogsLoadError] = useState('');
  const [blogDetailOpen, setBlogDetailOpen] = useState(false);
  const [blogDetailLoading, setBlogDetailLoading] = useState(false);
  const [blogDetailError, setBlogDetailError] = useState('');
  const [blogDetail, setBlogDetail] = useState(null);
  const [blogDetailFetchId, setBlogDetailFetchId] = useState(null);
  const [codeForm, setCodeForm] = useState({
    code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '',
    startDate: '', endDate: '', quantity: '',
  });
  const [blogForm, setBlogForm] = useState(() => emptyBlogForm());
  const [blogSubmitting, setBlogSubmitting] = useState(false);
  const [blogSubmitError, setBlogSubmitError] = useState('');
  const [blogDeletingId, setBlogDeletingId] = useState(null); // optimistic delete
  const [blogStatusPatchingId, setBlogStatusPatchingId] = useState(null);
  const [blogImageFile, setBlogImageFile] = useState(null); // File gốc
  const [blogImagePreview, setBlogImagePreview] = useState(''); // blob URL preview
  const [feedbackRows, setFeedbackRows] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackLoadError, setFeedbackLoadError] = useState('');

  /* ── Blog search + pagination ── */
  const [blogSearch, setBlogSearch] = useState('');
  const [blogPage, setBlogPage] = useState(1);
  const BLOG_PAGE_SIZE = 5;

  const filteredPosts = useMemo(() => {
    const q = blogSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        String(p.title || '').toLowerCase().includes(q)
        || String(p.author || '').toLowerCase().includes(q)
        || String(p.date || '').toLowerCase().includes(q),
    );
  }, [posts, blogSearch]);

  const totalBlogPages = Math.max(1, Math.ceil(filteredPosts.length / BLOG_PAGE_SIZE));
  const currentBlogPage = Math.min(blogPage, totalBlogPages);
  const pagedPosts = useMemo(
    () => filteredPosts.slice((currentBlogPage - 1) * BLOG_PAGE_SIZE, currentBlogPage * BLOG_PAGE_SIZE),
    [filteredPosts, currentBlogPage],
  );

  const handleBlogSearchChange = (e) => {
    setBlogSearch(e.target.value);
    setBlogPage(1);
  };

  const loadDiscounts = useCallback(async () => {
    setCodesLoading(true);
    setCodesLoadError('');
    try {
      const list = await discountAPI.getAllDiscounts();
      const arr = Array.isArray(list) ? list : [];
      setCodes(arr.map(mapApiDiscountToRow));
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không tải được danh sách mã';
      setCodesLoadError(typeof msg === 'string' ? msg : 'Lỗi tải danh sách');
      setCodes([]);
    } finally {
      setCodesLoading(false);
    }
  }, []);

  const loadBlogs = useCallback(async () => {
    setBlogsLoading(true);
    setBlogsLoadError('');
    try {
      const list = await blogAPI.getBlogLists();
      const arr = Array.isArray(list) ? list : [];
      setPosts(arr.map(mapApiBlogToRow));
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không tải được danh sách blog';
      setBlogsLoadError(typeof msg === 'string' ? msg : 'Lỗi tải danh sách');
      setPosts([]);
    } finally {
      setBlogsLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    setFeedbackLoadError('');
    try {
      const list = await feedbackAPI.getFeedbackLists();
      const arr = Array.isArray(list) ? list : [];
      setFeedbackRows(arr.map(mapApiFeedbackToRow));
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không tải được phản hồi';
      setFeedbackLoadError(typeof msg === 'string' ? msg : 'Lỗi tải phản hồi');
      setFeedbackRows([]);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  useEffect(() => {
    if (tab === 'blog') {
      setBlogPage(1);
      loadBlogs();
    }
  }, [tab, loadBlogs]);

  useEffect(() => {
    if (tab === 'reviews') {
      loadFeedback();
    }
  }, [tab, loadFeedback]);

  /* ── Services ── */
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [servicesSearch, setServicesSearch] = useState('');
  const [servicesPage, setServicesPage] = useState(1);
  const SERVICES_PAGE_SIZE = 5;
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState(() => emptyServiceForm());
  const [serviceSubmitError, setServiceSubmitError] = useState('');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceImageFile, setServiceImageFile] = useState(null);
  const [serviceImagePreview, setServiceImagePreview] = useState('');
  const [serviceDeletingId, setServiceDeletingId] = useState(null);
  const [serviceToggleBusyId, setServiceToggleBusyId] = useState(null);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try {
      const list = await serviceAPI.getServices();
      const arr = Array.isArray(list) ? list : [];
      setServices(arr.map(mapApiServiceToRow));
    } catch (e) {
      setServicesError('Không tải được danh sách dịch vụ.');
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const filteredServices = useMemo(() => {
    const q = servicesSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        String(s.name || '').toLowerCase().includes(q)
        || String(s.description || '').toLowerCase().includes(q),
    );
  }, [services, servicesSearch]);

  const totalServicePages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PAGE_SIZE));
  const currentServicePage = Math.min(servicesPage, totalServicePages);
  const pagedServices = useMemo(
    () => filteredServices.slice((currentServicePage - 1) * SERVICES_PAGE_SIZE, currentServicePage * SERVICES_PAGE_SIZE),
    [filteredServices, currentServicePage],
  );

  useEffect(() => {
    if (tab === 'services') {
      setServicesPage(1);
      loadServices();
    }
  }, [tab, loadServices]);

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    setEditingService(null);
    setServiceSubmitError('');
    setServiceSubmitting(false);
    setServiceForm(emptyServiceForm());
    revokeBlogPreviewIfBlob(serviceImagePreview);
    setServiceImageFile(null);
    setServiceImagePreview('');
  };

  const openNewService = () => {
    setServiceSubmitError('');
    setEditingService(null);
    setServiceForm(emptyServiceForm());
    revokeBlogPreviewIfBlob(serviceImagePreview);
    setServiceImageFile(null);
    setServiceImagePreview('');
    setServiceModalOpen(true);
  };

  const openEditService = (row) => {
    setServiceSubmitError('');
    const r = row.raw || {};
    const p = Number(r.servicePrice ?? r.price);
    setServiceForm({
      title: (r.title || row.name || '').trim(),
      servicePrice: Number.isFinite(p) ? String(Math.round(p)) : '',
      description: (r.description || '').trim(),
      unit: (r.unit || '').trim(),
      image: (r.image || '').trim(),
      isAvailable: r.isAvailable != null ? Boolean(r.isAvailable) : Boolean(row.active),
    });
    revokeBlogPreviewIfBlob(serviceImagePreview);
    setServiceImageFile(null);
    setServiceImagePreview('');
    setEditingService(row);
    setServiceModalOpen(true);
  };

  const buildServiceApiPayload = (imagePath) => {
    const title = (serviceForm.title || '').trim();
    if (!title) throw new Error('Tên dịch vụ không được để trống');
    const servicePrice = parseMoneyInput(serviceForm.servicePrice);
    if (!Number.isFinite(servicePrice) || servicePrice < 0) throw new Error('Giá không hợp lệ');
    return {
      title,
      servicePrice,
      description: (serviceForm.description || '').trim(),
      unit: (serviceForm.unit || '').trim(),
      image: (imagePath || '').trim(),
      isAvailable: Boolean(serviceForm.isAvailable),
    };
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    setServiceSubmitError('');
    setServiceSubmitting(true);
    try {
      let imagePath = (serviceForm.image || '').trim();
      if (serviceImageFile) {
        try {
          imagePath = await uploadServiceImageToCloudinary(serviceImageFile);
        } catch {
          setServiceSubmitError('Upload ảnh thất bại. Vui lòng thử lại.');
          setServiceSubmitting(false);
          return;
        }
      }
      const payload = buildServiceApiPayload(imagePath);
      if (editingService?.id != null) {
        const sid = Number(editingService.id);
        if (!Number.isFinite(sid) || sid <= 0) {
          setServiceSubmitError('ID dịch vụ không hợp lệ');
          setServiceSubmitting(false);
          return;
        }
        await serviceAPI.update(sid, payload);
      } else {
        await serviceAPI.create(payload);
      }
      await loadServices();
      closeServiceModal();
    } catch (err) {
      const msg =
        (typeof err.message === 'string' && err.message) ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Không lưu được dịch vụ.';
      setServiceSubmitError(typeof msg === 'string' ? msg : 'Lỗi không xác định');
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleDeleteService = async (row) => {
    const sid = Number(row?.id);
    if (!Number.isFinite(sid) || sid <= 0) return;
    const name = (row.name || 'dịch vụ này').trim();
    if (!window.confirm(`Xóa dịch vụ "${name}"? Thao tác không hoàn tác.`)) return;
    setServiceDeletingId(sid);
    try {
      await serviceAPI.delete(sid);
      await loadServices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không xóa được dịch vụ.';
      window.alert(typeof msg === 'string' ? msg : 'Lỗi xóa');
    } finally {
      setServiceDeletingId(null);
    }
  };

  /** PUT /api/services/{id} — chỉ đổi isAvailable (body đầy đủ ServiceUpdateDto) */
  const toggleServiceAvailable = async (row) => {
    const sid = Number(row?.id);
    if (!Number.isFinite(sid) || sid <= 0) return;
    if (serviceToggleBusyId != null) return;
    const raw = row.raw || {};
    const nextAvailable = !row.active;
    const p = Number(raw.servicePrice ?? raw.price);
    const title = (raw.title || row.name || '').trim();
    if (!title) {
      window.alert('Thiếu tên dịch vụ, không thể cập nhật.');
      return;
    }
    setServiceToggleBusyId(sid);
    try {
      await serviceAPI.update(sid, {
        title,
        servicePrice: Number.isFinite(p) ? p : 0,
        description: (raw.description || '').trim(),
        unit: (raw.unit || '').trim(),
        image: (raw.image || raw.imageUrl || '').toString().trim(),
        isAvailable: nextAvailable,
      });
      await loadServices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không cập nhật được trạng thái dịch vụ.';
      window.alert(typeof msg === 'string' ? msg : 'Lỗi cập nhật');
    } finally {
      setServiceToggleBusyId(null);
    }
  };

  /* ── Events ── */
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [eventsSearch, setEventsSearch] = useState('');
  const [eventsPage, setEventsPage] = useState(1);
  const EVENTS_PAGE_SIZE = 5;
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(() => emptyEventForm());
  const [eventSubmitError, setEventSubmitError] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventImageFile, setEventImageFile] = useState(null);
  const [eventImagePreview, setEventImagePreview] = useState('');
  const [eventDeletingId, setEventDeletingId] = useState(null);
  const [eventToggleBusyId, setEventToggleBusyId] = useState(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const list = await eventsAPI.getEvents();
      const arr = Array.isArray(list) ? list : [];
      setEvents(arr.map(mapApiEventToRow));
    } catch (e) {
      setEventsError('Không tải được danh sách sự kiện.');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const filteredEvents = useMemo(() => {
    const q = eventsSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        String(e.title || '').toLowerCase().includes(q)
        || String(e.eventType || '').toLowerCase().includes(q)
        || String(e.description || '').toLowerCase().includes(q),
    );
  }, [events, eventsSearch]);

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE));
  const currentEventPage = Math.min(eventsPage, totalEventPages);
  const pagedEvents = useMemo(
    () => filteredEvents.slice((currentEventPage - 1) * EVENTS_PAGE_SIZE, currentEventPage * EVENTS_PAGE_SIZE),
    [filteredEvents, currentEventPage],
  );

  useEffect(() => {
    if (tab === 'events') {
      setEventsPage(1);
      loadEvents();
    }
  }, [tab, loadEvents]);

  const closeEventModal = () => {
    setEventModalOpen(false);
    setEditingEvent(null);
    setEventSubmitError('');
    setEventSubmitting(false);
    setEventForm(emptyEventForm());
    revokeBlogPreviewIfBlob(eventImagePreview);
    setEventImageFile(null);
    setEventImagePreview('');
  };

  const openNewEvent = () => {
    setEventSubmitError('');
    setEditingEvent(null);
    setEventForm(emptyEventForm());
    revokeBlogPreviewIfBlob(eventImagePreview);
    setEventImageFile(null);
    setEventImagePreview('');
    setEventModalOpen(true);
  };

  const openEditEvent = (row) => {
    setEventSubmitError('');
    const r = row.raw || {};
    const priceVal = Number(r.basePrice ?? r.price);
    setEventForm({
      title: (r.title || '').trim(),
      description: (r.description || '').trim(),
      eventType: (r.eventTypeKey || r.eventType || 'Wedding').trim(),
      image: (r.image || '').trim(),
      price: Number.isFinite(priceVal) && priceVal > 0 ? String(Math.round(priceVal)) : '',
      isActive: r.isActive != null ? Boolean(r.isActive) : true,
    });
    revokeBlogPreviewIfBlob(eventImagePreview);
    setEventImageFile(null);
    setEventImagePreview('');
    setEditingEvent(row);
    setEventModalOpen(true);
  };

  /** Swagger EventCreateDto — không gửi field lạ (additionalProperties: false) */
  const buildEventCreatePayload = (imagePath) => {
    const title = (eventForm.title || '').trim();
    if (!title) throw new Error('Tên sự kiện không được để trống');
    const createdBy = getCreatedByUserId();
    if (!createdBy) throw new Error('Vui lòng đăng nhập để tạo sự kiện');
    const basePriceNum = parseMoneyInput(eventForm.price);
    const basePrice = Number.isFinite(basePriceNum) && basePriceNum > 0 ? basePriceNum : null;
    const desc = (eventForm.description || '').trim();
    const img = (imagePath || '').trim();
    return {
      title,
      createdBy,
      description: desc || null,
      eventType: (eventForm.eventType || 'Wedding').trim() || null,
      image: img || null,
      basePrice,
      isActive: Boolean(eventForm.isActive),
    };
  };

  /** Swagger EventUpdateDto */
  const buildEventUpdatePayload = (imagePath) => {
    const title = (eventForm.title || '').trim();
    if (!title) throw new Error('Tên sự kiện không được để trống');
    const basePriceNum = parseMoneyInput(eventForm.price);
    const basePrice = Number.isFinite(basePriceNum) && basePriceNum > 0 ? basePriceNum : null;
    const desc = (eventForm.description || '').trim();
    const img = (imagePath || '').trim();
    return {
      title,
      description: desc || null,
      eventType: (eventForm.eventType || 'Wedding').trim() || null,
      image: img || null,
      basePrice,
      isActive: Boolean(eventForm.isActive),
    };
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setEventSubmitError('');
    setEventSubmitting(true);
    try {
      let imagePath = (eventForm.image || '').trim();
      if (eventImageFile) {
        try {
          imagePath = await uploadServiceImageToCloudinary(eventImageFile);
        } catch {
          setEventSubmitError('Upload ảnh thất bại. Vui lòng thử lại.');
          setEventSubmitting(false);
          return;
        }
      }
      if (editingEvent?.id != null) {
        const eid = Number(editingEvent.id);
        if (!Number.isFinite(eid) || eid <= 0) {
          setEventSubmitError('ID sự kiện không hợp lệ');
          setEventSubmitting(false);
          return;
        }
        const payload = buildEventUpdatePayload(imagePath);
        await eventsAPI.update(eid, payload);
      } else {
        const payload = buildEventCreatePayload(imagePath);
        await eventsAPI.create(payload);
      }
      await loadEvents();
      closeEventModal();
    } catch (err) {
      if (!err.response && (err.code === 'ERR_NETWORK' || String(err.message || '').includes('Network'))) {
        setEventSubmitError('Không kết nối được máy chủ (Network Error). Kiểm tra mạng, URL API hoặc CORS.');
      } else {
        const d = err.response?.data;
        let msg =
          (typeof err.message === 'string' && err.message) ||
          (typeof d?.message === 'string' && d.message) ||
          (typeof d?.title === 'string' && d.title) ||
          '';
        if (!msg && d?.errors && typeof d.errors === 'object') {
          msg = Object.entries(d.errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ');
        }
        setEventSubmitError(msg || 'Không lưu được sự kiện.');
      }
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteEvent = async (row) => {
    const eid = Number(row?.id);
    if (!Number.isFinite(eid) || eid <= 0) return;
    const name = (row.title || 'sự kiện này').trim();
    if (!window.confirm(`Xóa sự kiện "${name}" khỏi hệ thống (API)? Thao tác không hoàn tác.`)) return;
    setEventDeletingId(eid);
    try {
      await eventsAPI.delete(eid);
      await loadEvents();
    } catch (err) {
      let msg = err.response?.data?.message || err.message || 'Không xóa được sự kiện.';
      if (!err.response && (err.code === 'ERR_NETWORK' || String(err.message || '').includes('Network'))) {
        msg = 'Không kết nối được máy chủ khi xóa. Kiểm tra mạng hoặc đăng nhập.';
      }
      window.alert(typeof msg === 'string' ? msg : 'Lỗi xóa');
    } finally {
      setEventDeletingId(null);
    }
  };

  /** PATCH /api/events/{id}/status — EventStatusPatchDto { isActive } */
  const toggleEventActive = async (row) => {
    const eid = Number(row?.id);
    if (!Number.isFinite(eid) || eid <= 0) return;
    if (eventToggleBusyId != null) return;
    const next = !row.active;
    setEventToggleBusyId(eid);
    try {
      await eventsAPI.patchStatus(eid, next);
      await loadEvents();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không cập nhật được trạng thái sự kiện.';
      window.alert(typeof msg === 'string' ? msg : 'Lỗi cập nhật');
    } finally {
      setEventToggleBusyId(null);
    }
  };

  const buildDiscountPayload = () => {
    const createdBy = getCreatedByUserId();
    if (!createdBy) {
      throw new Error('Vui lòng đăng nhập để tạo mã giảm giá');
    }
    const discountType = codeForm.type === 'percent' ? 'Percentage' : 'FixedAmount';
    const valueNum = parseMoneyInput(codeForm.value);
    return {
      code: codeForm.code.trim().toUpperCase(),
      description: (codeForm.description || '').trim() || codeForm.code.trim(),
      discountType,
      value: valueNum,
      minOrderAmount: parseMoneyInput(codeForm.minOrder),
      maxDiscountAmount: parseMoneyInput(codeForm.maxDiscount),
      startDate: codeForm.startDate,
      endDate: codeForm.endDate,
      usageLimit: parseInt(String(codeForm.quantity).replace(/\D/g, ''), 10) || 0,
      applicableFor: codeForm.type === 'ship' ? 'Shipping' : 'Order',
      status: 'Active',
      createdBy,
    };
  };

  /** PUT /api/discount/{id} — theo DiscountUpdateDto (Swagger), không gửi code */
  const buildDiscountUpdatePayload = (raw) => {
    const discountType = codeForm.type === 'percent' ? 'Percentage' : 'FixedAmount';
    const valueNum = parseMoneyInput(codeForm.value);
    const usedCount = Number(raw?.usedCount ?? raw?.used_count ?? 0);
    const statusStr = (raw?.status && String(raw.status)) || 'Active';
    return {
      description: (codeForm.description || '').trim() || codeForm.code.trim(),
      discountType,
      value: valueNum,
      minOrderAmount: parseMoneyInput(codeForm.minOrder),
      maxDiscountAmount: parseMoneyInput(codeForm.maxDiscount),
      startDate: codeForm.startDate,
      endDate: codeForm.endDate,
      usageLimit: parseInt(String(codeForm.quantity).replace(/\D/g, ''), 10) || 0,
      applicableFor: codeForm.type === 'ship' ? 'Shipping' : 'Order',
      status: statusStr,
      usedCount: Number.isFinite(usedCount) && usedCount >= 0 ? usedCount : 0,
    };
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    setCodeSubmitError('');

    if (editingCode) {
      const discountId = editingCode.id;
      if (discountId == null || !Number.isFinite(Number(discountId)) || Number(discountId) <= 0) {
        setCodeSubmitError('Không xác định được ID mã giảm giá để cập nhật.');
        return;
      }
      setCodeSubmitting(true);
      try {
        const raw = editingCode.raw || {};
        const payload = buildDiscountUpdatePayload(raw);
        await discountAPI.updateDiscount(discountId, payload);
        await loadDiscounts();
      setEditingCode(null);
        setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' });
        setCodeModalOpen(false);
      } catch (err) {
        const msg =
          (typeof err.message === 'string' && err.message) ||
          err.response?.data?.message ||
          err.response?.data?.title ||
          'Không cập nhật được mã. Kiểm tra dữ liệu hoặc quyền đăng nhập.';
        setCodeSubmitError(typeof msg === 'string' ? msg : 'Lỗi không xác định');
      } finally {
        setCodeSubmitting(false);
      }
      return;
    }

    setCodeSubmitting(true);
    try {
      const payload = buildDiscountPayload();
      await discountAPI.createDiscount(payload);
      await loadDiscounts();
    setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' });
    setCodeModalOpen(false);
    } catch (err) {
      const msg =
        (typeof err.message === 'string' && err.message) ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Không tạo được mã. Kiểm tra dữ liệu hoặc quyền đăng nhập.';
      setCodeSubmitError(typeof msg === 'string' ? msg : 'Lỗi không xác định');
    } finally {
      setCodeSubmitting(false);
    }
  };

  const buildBlogCreatePayload = () => {
    const authorId = getCreatedByUserId();
    if (!authorId) {
      throw new Error('Vui lòng đăng nhập để đăng bài blog');
    }
    const title = (blogForm.title || '').trim();
    if (!title) {
      throw new Error('Tiêu đề không được để trống');
    }
    const content = blogForm.content != null ? String(blogForm.content) : '';
    if (!content.trim()) {
      throw new Error('Nội dung không được để trống');
    }
    const publishedAt = publishedAtToIsoForApi(blogForm.publishedAt);
    const status = (blogForm.status || 'Published').trim() || 'Published';
    const image = (blogForm.image || '').trim();
    return {
      title,
      content,
      image: image || '',
      viewCount: 0,
      status,
      publishedAt,
      authorId,
    };
  };

  /** PUT /api/blogs/{id} — không gửi authorId (theo Swagger BlogUpdateDto) */
  const buildBlogUpdatePayload = (imagePath, raw) => {
    const title = (blogForm.title || '').trim();
    if (!title) {
      throw new Error('Tiêu đề không được để trống');
    }
    const content = blogForm.content != null ? String(blogForm.content) : '';
    if (!content.trim()) {
      throw new Error('Nội dung không được để trống');
    }
    const publishedAt = publishedAtToIsoForApi(blogForm.publishedAt);
    const status = (blogForm.status || 'Published').trim() || 'Published';
    const vc = Number(raw?.viewCount ?? 0);
    return {
      title,
      content,
      image: (imagePath || '').trim(),
      viewCount: Number.isFinite(vc) && vc >= 0 ? vc : 0,
      status,
      publishedAt,
    };
  };

  const handleSubmitBlog = async (e) => {
    e.preventDefault();
    setBlogSubmitError('');

    if (editingBlog) {
      const blogId = editingBlog.id;
      if (blogId == null || !Number.isFinite(Number(blogId)) || Number(blogId) <= 0) {
        setBlogSubmitError('Không xác định được ID blog để cập nhật.');
        return;
      }
      setBlogSubmitting(true);
      try {
        let imagePath = (blogForm.image || '').trim();
        if (blogImageFile) {
          try {
            imagePath = await uploadBlogImageToCloudinary(blogImageFile);
          } catch (upErr) {
            setBlogSubmitError('Upload ảnh thất bại. Vui lòng thử lại.');
            setBlogSubmitting(false);
            return;
          }
        }
        const raw = editingBlog.raw || {};
        const payload = buildBlogUpdatePayload(imagePath, raw);
        await blogAPI.updateBlog(blogId, payload);
        await loadBlogs();
      setEditingBlog(null);
        setBlogForm(emptyBlogForm());
        setBlogImageFile(null);
        revokeBlogPreviewIfBlob(blogImagePreview);
        setBlogImagePreview('');
        setBlogModalOpen(false);
      } catch (err) {
        const msg =
          (typeof err.message === 'string' && err.message) ||
          err.response?.data?.message ||
          err.response?.data?.title ||
          'Không cập nhật được bài. Kiểm tra dữ liệu hoặc quyền đăng nhập.';
        setBlogSubmitError(typeof msg === 'string' ? msg : 'Lỗi không xác định');
      } finally {
        setBlogSubmitting(false);
      }
      return;
    }

    setBlogSubmitting(true);
    try {
      // 1. Upload ảnh lên Cloudinary trước (nếu có file mới)
      let imagePath = (blogForm.image || '').trim();
      if (blogImageFile) {
        try {
          imagePath = await uploadBlogImageToCloudinary(blogImageFile);
        } catch (upErr) {
          setBlogSubmitError('Upload ảnh thất bại. Vui lòng thử lại.');
          setBlogSubmitting(false);
          return;
        }
      }

      // 2. Tạo blog với image URL đã upload
      const payload = {
        ...buildBlogCreatePayload(),
        image: imagePath,
      };
      await blogAPI.createBlog(payload);
      await loadBlogs();

      // 3. Dọn blob preview
      revokeBlogPreviewIfBlob(blogImagePreview);
      setBlogImageFile(null);
      setBlogImagePreview('');
      setBlogForm(emptyBlogForm());
    setBlogModalOpen(false);
    } catch (err) {
      const msg =
        (typeof err.message === 'string' && err.message) ||
        err.response?.data?.message ||
        err.response?.data?.title ||
        'Không đăng được bài. Kiểm tra dữ liệu hoặc quyền đăng nhập.';
      setBlogSubmitError(typeof msg === 'string' ? msg : 'Lỗi không xác định');
    } finally {
      setBlogSubmitting(false);
    }
  };

  const applyDiscountToForm = (d, codeRow) => {
    const typeValue =
      d.discountType === 'Percentage'
        ? 'percent'
        : (String(d.applicableFor || '').toLowerCase() === 'shipping' ? 'ship' : 'fixed');
    setCodeForm({
      code: d.code || '',
      type: typeValue,
      description: d.description || '',
      value: d.value != null ? String(d.value) : '',
      minOrder: d.minOrderAmount != null ? String(d.minOrderAmount) : '',
      maxDiscount: d.maxDiscountAmount != null ? String(d.maxDiscountAmount) : '',
      startDate: d.startDate ? String(d.startDate).slice(0, 10) : '',
      endDate: d.endDate ? String(d.endDate).slice(0, 10) : '',
      quantity: d.usageLimit != null ? String(d.usageLimit) : '',
    });
    setEditingCode({ ...codeRow, raw: d });
    setCodeModalOpen(true);
  };

  const openEditCode = async (codeRow) => {
    setCodeSubmitError('');
    let d = codeRow.raw;
    if (codeRow.id != null) {
      try {
        const fresh = await discountAPI.getDiscountById(codeRow.id);
        if (fresh && typeof fresh === 'object') d = fresh;
      } catch (e) {
        if (!d) {
          const msg = e.response?.data?.message || e.message || 'Không tải được chi tiết mã';
          setCodeSubmitError(typeof msg === 'string' ? msg : 'Lỗi tải chi tiết');
          return;
        }
      }
    }
    if (d) {
      applyDiscountToForm(d, codeRow);
      return;
    }
    const typeValue = codeRow.type === 'Phần trăm (%)' ? 'percent' : codeRow.type === 'Vận chuyển' ? 'ship' : 'fixed';
    setCodeForm({
      code: codeRow.code,
      type: typeValue,
      description: '',
      value: codeRow.value.replace(/\D/g, ''),
      minOrder: '',
      maxDiscount: '',
      startDate: codeRow.start,
      endDate: codeRow.end,
      quantity: '',
    });
    setEditingCode(codeRow);
    setCodeModalOpen(true);
  };

  const openEditBlog = (blog) => {
    const raw = blog.raw || {};
    const pub = raw.publishedAt ? new Date(raw.publishedAt) : new Date();
    const imgPath = pickBlogImagePath(raw) || blog.image || '';
    setBlogSubmitError('');
    setBlogForm({
      title: blog.title || '',
      content: blog.content || raw.content || '',
      image: imgPath,
      status: raw.status != null && String(raw.status).trim() !== '' ? String(raw.status) : 'Published',
      publishedAt: Number.isNaN(pub.getTime()) ? toDatetimeLocalValue(new Date()) : toDatetimeLocalValue(pub),
    });
    // Hiển thị ảnh hiện có (URL tuyệt đối hoặc đường dẫn API)
    if (imgPath) {
      const abs = /^https?:\/\//i.test(imgPath) ? imgPath : resolveBlogImageUrl(imgPath);
      setBlogImagePreview(abs || '');
      setBlogImageFile(null);
    } else {
      setBlogImagePreview('');
      setBlogImageFile(null);
    }
    setEditingBlog(blog);
    setBlogModalOpen(true);
  };

  const closeCodeModal = () => {
    setCodeModalOpen(false);
    setEditingCode(null);
    setCodeSubmitError('');
    setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' });
  };

  const handleDeleteCode = async (row) => {
    const id = row?.id;
    if (id == null || !Number.isFinite(Number(id)) || Number(id) <= 0) {
      return;
    }
    const ok = window.confirm(`Xóa mã giảm giá "${row.code}"? Hành động này không hoàn tác.`);
    if (!ok) return;
    setCodesLoadError('');
    try {
      await discountAPI.deleteDiscount(id);
      await loadDiscounts();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không xóa được mã';
      setCodesLoadError(typeof msg === 'string' ? msg : 'Lỗi xóa mã');
    }
  };

  const closeBlogModal = () => {
    setBlogModalOpen(false);
    setEditingBlog(null);
    setBlogSubmitError('');
    setBlogSubmitting(false);
    setBlogForm(emptyBlogForm());
    revokeBlogPreviewIfBlob(blogImagePreview);
    setBlogImageFile(null);
    setBlogImagePreview('');
  };

  const handleDeleteBlog = async (row) => {
    const id = row?.id;
    if (id == null || !Number.isFinite(Number(id)) || Number(id) <= 0) {
      return;
    }
    const ok = window.confirm(`Xóa bài viết "${row.title}"? Hành động này không hoàn tác.`);
    if (!ok) return;

    // 1. Lập tức xóa khỏi UI (optimistic)
    setBlogDeletingId(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));

    try {
      await blogAPI.deleteBlog(id);
      // Thành công → danh sách đã đồng bộ ở trên
    } catch (e) {
      // Thất bại → khôi phục lại vào danh sách
      setPosts((prev) => {
        if (prev.find((p) => p.id === id)) return prev; // đã có thì giữ nguyên
        return [...prev, row];
      });
      const msg = e.response?.data?.message || e.message || 'Không xóa được bài viết';
      setBlogsLoadError(typeof msg === 'string' ? msg : 'Lỗi xóa bài');
    } finally {
      setBlogDeletingId(null);
    }
  };

  const closeBlogDetailModal = () => {
    setBlogDetailOpen(false);
    setBlogDetail(null);
    setBlogDetailError('');
    setBlogDetailLoading(false);
    setBlogDetailFetchId(null);
  };

  const openBlogDetail = async (row) => {
    setBlogDetailOpen(true);
    setBlogDetail(null);
    setBlogDetailError('');
    setBlogDetailLoading(true);
    const id = row?.id;
    if (id == null || !Number.isFinite(Number(id)) || Number(id) <= 0) {
      setBlogDetailLoading(false);
      setBlogDetailFetchId(null);
      setBlogDetailError('Không có ID blog hợp lệ.');
      return;
    }
    setBlogDetailFetchId(Number(id));
    try {
      const data = await blogAPI.getBlogById(id);
      if (data && typeof data === 'object') {
        setBlogDetail(data);
      } else {
        setBlogDetailError('Dữ liệu blog không hợp lệ.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không tải được chi tiết blog';
      setBlogDetailError(typeof msg === 'string' ? msg : 'Lỗi tải chi tiết');
    } finally {
      setBlogDetailLoading(false);
    }
  };

  const openEditFromBlogDetail = () => {
    const row = blogRowFromDetail(blogDetail);
    if (!row) return;
    closeBlogDetailModal();
    openEditBlog(row);
  };

  const shareBlogDetail = async () => {
    if (!blogDetail) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: blogDetail.title || 'Blog',
          text: blogDetail.title || '',
          url,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (_) {
      /* Hủy chia sẻ hoặc lỗi clipboard */
    }
  };

  /**
   * Đổi Published / Draft — dùng PUT /api/blogs/{id} (BlogUpdateDto).
   * Nhiều backend trả 403 với PATCH từng phần; PUT với cùng quyền với form sửa bài thì vẫn được.
   */
  const handleToggleBlogStatus = async (row) => {
    const blogId = Number(row?.id);
    if (!Number.isFinite(blogId) || blogId <= 0) return;
    const nextOn = !row.on;
    const nextStatus = nextOn ? 'Published' : 'Draft';
    setBlogStatusPatchingId(blogId);
    try {
      const hasContent = String(row.raw?.content ?? row.content ?? '').trim().length > 0;
      const detail = hasContent ? null : await blogAPI.getBlogById(blogId);
      const payload = buildBlogPutPayloadForStatusChange(row, nextStatus, detail);
      await blogAPI.updateBlog(blogId, payload);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === blogId
            ? {
              ...p,
              on: nextOn,
              raw: p.raw && typeof p.raw === 'object' ? { ...p.raw, status: nextStatus } : p.raw,
            }
            : p,
        ),
      );
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Không cập nhật được trạng thái blog.';
      window.alert(typeof msg === 'string' ? msg : 'Lỗi');
    } finally {
      setBlogStatusPatchingId(null);
    }
  };

  const statusLabel = (s) => ({ running: 'ĐANG CHẠY', upcoming: 'SẮP TỚI', expired: 'HẾT HẠN' }[s] || s);

  const filteredCodes = codes.filter((row) => {
    const q = codeSearch.trim().toLowerCase();
    if (!q) return true;
    return String(row.code || '').toLowerCase().includes(q);
  });

  const feedbackSummary = useMemo(() => computeFeedbackSummary(feedbackRows), [feedbackRows]);

  return (
    <div className="admin-restaurant">
      <header className="rest-header">
        <div>
          <h1 className="rest-title">Quản lý Nhà hàng</h1>
          <p className="rest-subtitle">Xem và cập nhật thông tin vận hành của bạn</p>
        </div>
        <button type="button" className="rest-bell-btn" aria-label="Thông báo">
          <Bell size={20} />
        </button>
      </header>

      <div className="rest-tabs">
        <button type="button" className={`rest-tab ${tab === 'codes' ? 'active' : ''}`} onClick={() => setTab('codes')}>
          Mã giảm giá
        </button>
        <button type="button" className={`rest-tab ${tab === 'blog' ? 'active' : ''}`} onClick={() => setTab('blog')}>
          Blog
        </button>
        <button type="button" className={`rest-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
          Đánh giá
        </button>
        <button type="button" className={`rest-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
          Phục vụ
        </button>
        <button type="button" className={`rest-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          Sự kiện
        </button>
      </div>

      {tab === 'codes' && (
        <>
          <div className="rest-toolbar">
            <div className="rest-search-wrap">
              <Search size={18} className="rest-search-icon" />
              <input
                type="text"
                className="rest-search"
                placeholder="Tìm theo mã code..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
              />
            </div>
            <button type="button" className="rest-btn-primary" onClick={() => { setEditingCode(null); setCodeSubmitError(''); setCodeForm({ code: '', type: 'percent', description: '', value: '', minOrder: '', maxDiscount: '', startDate: '', endDate: '', quantity: '' }); setCodeModalOpen(true); }}>
              <Plus size={18} />
              Thêm mã mới
            </button>
          </div>
          {codesLoading && <p className="rest-subtitle" style={{ marginTop: 8 }}>Đang tải danh sách mã giảm giá…</p>}
          {codesLoadError && (
            <p style={{ color: '#c0392b', marginTop: 8 }}>
              {codesLoadError}
              {' '}
              <button type="button" className="rest-btn-primary" style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => loadDiscounts()}>
                Thử lại
              </button>
            </p>
          )}
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>MÃ CODE</th>
                    <th>LOẠI GIẢM GIÁ</th>
                    <th>GIÁ TRỊ</th>
                    <th>BẮT ĐẦU</th>
                    <th>KẾT THÚC</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-code">{row.code}</td>
                      <td>{row.type}</td>
                      <td>{row.value}</td>
                      <td>{row.start}</td>
                      <td>{row.end}</td>
                      <td>
                        <span className={`rest-badge rest-badge-${row.status}`}>{statusLabel(row.status)}</span>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditCode(row)}><Pencil size={16} /></button>
                        <button type="button" className="rest-icon-btn" aria-label="Xóa" onClick={() => handleDeleteCode(row)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>Hiển thị {filteredCodes.length ? `1-${filteredCodes.length}` : '0'} trong {codes.length} mã</span>
              <div className="rest-pagination-btns">
                <button type="button" className="rest-page-btn">&lt;</button>
                <button type="button" className="rest-page-btn active">1</button>
                <button type="button" className="rest-page-btn">2</button>
                <button type="button" className="rest-page-btn">3</button>
                <button type="button" className="rest-page-btn">&gt;</button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'blog' && (
        <>
          <div className="rest-toolbar">
            <div className="rest-toolbar-search">
              <input
                type="text"
                className="rest-search-input"
                placeholder="Tìm kiếm tiêu đề, tác giả, ngày đăng…"
                value={blogSearch}
                onChange={handleBlogSearchChange}
              />
            </div>
            <div className="rest-toolbar-end">
              <button type="button" className="rest-btn-primary" onClick={() => {
                revokeBlogPreviewIfBlob(blogImagePreview);
                setBlogImageFile(null);
                setBlogImagePreview('');
                setEditingBlog(null);
                setBlogSubmitError('');
                setBlogForm(emptyBlogForm());
                setBlogModalOpen(true);
              }}>
              <Pencil size={18} />
              Tạo bài mới
            </button>
          </div>
          </div>
          {blogsLoading && <p className="rest-subtitle" style={{ marginTop: 8 }}>Đang tải danh sách blog…</p>}
          {blogsLoadError && (
            <p style={{ color: '#c0392b', marginTop: 8 }}>
              {blogsLoadError}
              {' '}
              <button type="button" className="rest-btn-primary" style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => loadBlogs()}>
                Thử lại
              </button>
            </p>
          )}
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>TIÊU ĐỀ BÀI VIẾT</th>
                    <th>TÁC GIẢ</th>
                    <th>NGÀY ĐĂNG</th>
                    <th>LƯỢT XEM</th>
                    <th>TRẠNG THÁI (BẬT/TẮT)</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPosts.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-title-cell">{row.title}</td>
                      <td>{row.author}</td>
                      <td>{row.date}</td>
                      <td>{row.views.toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className={`rest-toggle ${row.on ? 'active' : ''}`}
                          onClick={() => handleToggleBlogStatus(row)}
                          disabled={blogStatusPatchingId === row.id}
                          aria-label={row.on ? 'Chuyển sang nháp' : 'Xuất bản'}
                          title={row.on ? 'Đang đăng — nhấn để ẩn (Draft)' : 'Nháp — nhấn để đăng (Published)'}
                        >
                          <span className="rest-toggle-slider" />
                        </button>
                        <span className="rest-status-text">
                          {blogStatusPatchingId === row.id ? 'Đang lưu…' : (row.on ? 'Đăng' : 'Nháp')}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Xem chi tiết" onClick={() => openBlogDetail(row)}><Eye size={16} /></button>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditBlog(row)}><Pencil size={16} /></button>
                        <button
                          type="button"
                          className={`rest-icon-btn ${blogDeletingId === row.id ? 'rest-icon-btn--loading' : ''}`}
                          aria-label="Xóa bài"
                          disabled={blogDeletingId === row.id}
                          onClick={() => handleDeleteBlog(row)}
                        >
                          {blogDeletingId === row.id ? (
                            <span className="rest-spinner-sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!blogsLoading && !blogsLoadError && filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                        {blogSearch ? 'Không tìm thấy bài viết phù hợp.' : 'Chưa có bài viết nào.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>
                Hiển thị{' '}
                {filteredPosts.length
                  ? `${(currentBlogPage - 1) * BLOG_PAGE_SIZE + 1}–${Math.min(currentBlogPage * BLOG_PAGE_SIZE, filteredPosts.length)}`
                  : '0'}{' '}
                trong {filteredPosts.length} bài viết
              </span>
              <div className="rest-pagination-btns">
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentBlogPage <= 1}
                  onClick={() => setBlogPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalBlogPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rest-page-btn ${currentBlogPage === p ? 'active' : ''}`}
                    onClick={() => setBlogPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentBlogPage >= totalBlogPages}
                  onClick={() => setBlogPage((p) => Math.min(totalBlogPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'reviews' && (
        <>
          {feedbackLoading && <p className="rest-subtitle" style={{ marginBottom: 12 }}>Đang tải phản hồi…</p>}
          {feedbackLoadError && (
            <p style={{ color: '#c0392b', marginBottom: 12 }}>
              {feedbackLoadError}
              {' '}
              <button type="button" className="rest-btn-primary" style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => loadFeedback()}>
                Thử lại
              </button>
            </p>
          )}
        <div className="rest-reviews-layout">
          <div className="rest-reviews-left">
            <div className="rest-rating-card">
              <h3 className="rest-rating-title">Tổng quan đánh giá</h3>
                <div className="rest-rating-score">{feedbackSummary.avg != null ? feedbackSummary.avg.toFixed(1) : '—'}</div>
                <div className="rest-rating-stars">{feedbackSummary.starsVisual}</div>
                <p className="rest-rating-count">{feedbackSummary.countText}</p>
              <div className="rest-rating-bars">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const idx = star - 1;
                    const pct = feedbackSummary.bars[idx] ?? 0;
                    return (
                      <div key={star} className="rest-bar-row">
                        <span>{star} sao</span>
                        <div className="rest-bar-bg">
                          <div className={`rest-bar-fill rest-bar-${star}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="rest-sentiment-card">
              <h3 className="rest-sentiment-title">Sắc thái phản hồi</h3>
              <div className="rest-sentiment-row">
                  <div className="rest-sentiment-positive">{feedbackSummary.positivePct}% TÍCH CỰC (4–5★)</div>
                  <div className="rest-sentiment-negative">{feedbackSummary.negativePct}% TIÊU CỰC (1–2★)</div>
              </div>
            </div>
          </div>
          <div className="rest-reviews-right">
            <div className="rest-reviews-head">
                <h3 className="rest-reviews-title">Phản hồi từ API</h3>
                <select className="rest-select rest-select-sm" disabled aria-label="Sắp xếp">
                <option>Mới nhất</option>
              </select>
            </div>
              {!feedbackLoading && !feedbackLoadError && feedbackRows.length === 0 && (
                <p className="rest-subtitle" style={{ marginTop: 8 }}>Chưa có phản hồi nào.</p>
              )}
              {feedbackRows.map((r) => (
              <div key={r.id} className="rest-review-card">
                <div className="rest-review-header">
                    {r.avatarUrl ? (
                      <img className="rest-review-avatar rest-review-avatar-img" src={r.avatarUrl} alt="" />
                    ) : (
                  <div className="rest-review-avatar">{r.initials}</div>
                    )}
                  <div>
                    <strong>{r.name}</strong>
                    <span className="rest-review-time">{r.time}</span>
                  </div>
                </div>
                  <div className="rest-review-stars">
                    {r.stars > 0 ? '★'.repeat(r.stars) : '—'}
                  </div>
                  <p className="rest-review-comment">{r.comment || '—'}</p>
              </div>
            ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tab Phục vụ ── */}
      {tab === 'services' && (
        <>
          <div className="rest-toolbar">
            <div className="rest-toolbar-search">
              <input
                type="text"
                className="rest-search-input"
                placeholder="Tìm kiếm dịch vụ…"
                value={servicesSearch}
                onChange={(e) => { setServicesSearch(e.target.value); setServicesPage(1); }}
              />
            </div>
            <div className="rest-toolbar-end">
              <button type="button" className="rest-btn-primary" onClick={openNewService}>
                <Plus size={18} />
                Thêm dịch vụ
              </button>
            </div>
          </div>
          {servicesLoading && <p className="rest-subtitle" style={{ marginTop: 8 }}>Đang tải danh sách dịch vụ…</p>}
          {servicesError && (
            <p style={{ color: '#c0392b', marginTop: 8 }}>
              {servicesError}
              {' '}
              <button type="button" className="rest-btn-primary" style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => loadServices()}>
                Thử lại
              </button>
            </p>
          )}
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>HÌNH ẢNH</th>
                    <th>TÊN DỊCH VỤ</th>
                    <th>GIÁ</th>
                    <th>ĐƠN VỊ</th>
                    <th>MÔ TẢ</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedServices.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-code">#{row.id}</td>
                      <td>
                        <div className="rest-img-cell">
                          {row.imageUrl ? (
                            <img className="rest-img-thumb" src={row.imageUrl} alt={row.name} />
                          ) : (
                            <div className="rest-img-placeholder" />
                          )}
                        </div>
                      </td>
                      <td className="rest-title-cell">{row.name}</td>
                      <td>{row.price}</td>
                      <td>
                        {row.unit ? <span className="rest-badge rest-badge-running">{row.unit}</span> : '—'}
                      </td>
                      <td>{row.description || '—'}</td>
                      <td>
                        <div className="rest-service-status-cell">
                          <button
                            type="button"
                            className={`rest-toggle ${row.active ? 'active' : ''}`}
                            onClick={() => toggleServiceAvailable(row)}
                            disabled={!!serviceDeletingId || serviceToggleBusyId === row.id}
                            aria-busy={serviceToggleBusyId === row.id}
                            aria-label={row.active ? 'Tắt dịch vụ' : 'Bật dịch vụ'}
                          >
                            <span className="rest-toggle-slider" />
                          </button>
                          <span className={`rest-status-text ${row.active ? 'rest-status-on' : 'rest-status-off'}`}>
                            {row.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditService(row)} disabled={!!serviceDeletingId || serviceToggleBusyId === row.id}>
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="rest-icon-btn"
                          aria-label="Xóa"
                          onClick={() => handleDeleteService(row)}
                          disabled={serviceDeletingId === row.id || serviceToggleBusyId === row.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!servicesLoading && !servicesError && filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                        {servicesSearch ? 'Không tìm thấy dịch vụ phù hợp.' : 'Chưa có dịch vụ nào.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>
                Hiển thị{' '}
                {filteredServices.length
                  ? `${(currentServicePage - 1) * SERVICES_PAGE_SIZE + 1}–${Math.min(currentServicePage * SERVICES_PAGE_SIZE, filteredServices.length)}`
                  : '0'}{' '}
                trên tổng số {filteredServices.length} dịch vụ
              </span>
              <div className="rest-pagination-btns">
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentServicePage <= 1}
                  onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalServicePages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rest-page-btn ${currentServicePage === p ? 'active' : ''}`}
                    onClick={() => setServicesPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentServicePage >= totalServicePages}
                  onClick={() => setServicesPage((p) => Math.min(totalServicePages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab Sự Kiện (cùng layout bảng với Phục vụ) ── */}
      {tab === 'events' && (
        <>
          <div className="rest-toolbar">
            <div className="rest-toolbar-search">
              <input
                type="text"
                className="rest-search-input"
                placeholder="Tìm kiếm sự kiện…"
                value={eventsSearch}
                onChange={(e) => { setEventsSearch(e.target.value); setEventsPage(1); }}
              />
            </div>
            <div className="rest-toolbar-end">
              <button type="button" className="rest-btn-primary" onClick={openNewEvent}>
                <Plus size={18} />
                Thêm sự kiện
              </button>
            </div>
          </div>
          {eventsLoading && <p className="rest-subtitle" style={{ marginTop: 8 }}>Đang tải danh sách sự kiện…</p>}
          {eventsError && (
            <p style={{ color: '#c0392b', marginTop: 8 }}>
              {eventsError}
              {' '}
              <button type="button" className="rest-btn-primary" style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }} onClick={() => loadEvents()}>
                Thử lại
              </button>
            </p>
          )}
          <div className="rest-card">
            <div className="rest-table-wrap">
              <table className="rest-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>HÌNH ẢNH</th>
                    <th>TÊN SỰ KIỆN</th>
                    <th>GIÁ</th>
                    <th>ĐƠN VỊ</th>
                    <th>MÔ TẢ</th>
                    <th>TRẠNG THÁI</th>
                    <th>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEvents.map((row) => (
                    <tr key={row.id}>
                      <td className="rest-code">#{row.id}</td>
                      <td>
                        <div className="rest-img-cell">
                          {row.imageUrl ? (
                            <img className="rest-img-thumb" src={row.imageUrl} alt={row.title} />
                          ) : (
                            <div className="rest-img-placeholder" />
                          )}
                        </div>
                      </td>
                      <td className="rest-title-cell">{row.title}</td>
                      <td>{row.price}</td>
                      <td>
                        {row.eventType && row.eventType !== '—' ? (
                          <span className="rest-badge rest-badge-running">{row.eventType}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{row.description || '—'}</td>
                      <td>
                        <div className="rest-service-status-cell">
                          <button
                            type="button"
                            className={`rest-toggle ${row.active ? 'active' : ''}`}
                            onClick={() => toggleEventActive(row)}
                            disabled={!!eventDeletingId || eventToggleBusyId === row.id}
                            aria-busy={eventToggleBusyId === row.id}
                            aria-label={row.active ? 'Tắt sự kiện' : 'Bật sự kiện'}
                          >
                            <span className="rest-toggle-slider" />
                          </button>
                          <span className={`rest-status-text ${row.active ? 'rest-status-on' : 'rest-status-off'}`}>
                            {row.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button type="button" className="rest-icon-btn" aria-label="Sửa" onClick={() => openEditEvent(row)} disabled={!!eventDeletingId || eventToggleBusyId === row.id}>
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="rest-icon-btn"
                          aria-label="Xóa"
                          onClick={() => handleDeleteEvent(row)}
                          disabled={eventDeletingId === row.id || eventToggleBusyId === row.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!eventsLoading && !eventsError && filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                        {eventsSearch ? 'Không tìm thấy sự kiện phù hợp.' : 'Chưa có sự kiện nào.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="rest-pagination">
              <span>
                Hiển thị{' '}
                {filteredEvents.length
                  ? `${(currentEventPage - 1) * EVENTS_PAGE_SIZE + 1}–${Math.min(currentEventPage * EVENTS_PAGE_SIZE, filteredEvents.length)}`
                  : '0'}{' '}
                trên tổng số {filteredEvents.length} sự kiện
              </span>
              <div className="rest-pagination-btns">
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentEventPage <= 1}
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: totalEventPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rest-page-btn ${currentEventPage === p ? 'active' : ''}`}
                    onClick={() => setEventsPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="rest-page-btn"
                  disabled={currentEventPage >= totalEventPages}
                  onClick={() => setEventsPage((p) => Math.min(totalEventPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Sự Kiện ── */}
      {eventModalOpen && (
        <div className="rest-modal-overlay" onClick={closeEventModal}>
          <div className="rest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeEventModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitEvent} className="rest-modal-form">
              {eventSubmitError && (
                <p style={{ color: '#c0392b', marginBottom: 12, fontSize: 14 }} role="alert">
                  {eventSubmitError}
                </p>
              )}
              {/* Ảnh sự kiện */}
              <div className="rest-form-group">
                <label>Ảnh sự kiện</label>
                <div className="rest-blog-upload-wrap">
                  <label className="rest-blog-upload-zone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleBlogImageChange(f, setEventForm, setEventImageFile, setEventImagePreview);
                      }}
                    />
                    {(eventImagePreview || eventForm.image) ? (
                      <div className="rest-blog-upload-preview">
                        <img
                          src={blogFormImageDisplaySrc(eventImagePreview, eventForm.image)}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="rest-blog-upload-remove"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            revokeBlogPreviewIfBlob(eventImagePreview);
                            setEventImageFile(null);
                            setEventImagePreview('');
                            setEventForm((f) => ({ ...f, image: '' }));
                          }}
                          aria-label="Xóa ảnh"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="rest-blog-upload-placeholder">
                        <FileImage size={36} strokeWidth={1.5} />
                        <span>Chọn ảnh</span>
                        <small>JPG, PNG, WebP – Tối đa 5MB</small>
                      </div>
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Hoặc dán đường dẫn / URL ảnh (API: image)"
                  value={eventForm.image}
                  onChange={(e) => {
                    setEventForm((f) => ({ ...f, image: e.target.value }));
                    revokeBlogPreviewIfBlob(eventImagePreview);
                    setEventImageFile(null);
                    setEventImagePreview('');
                  }}
                  style={{ marginTop: 8 }}
                />
              </div>
              {/* Tiêu đề */}
              <div className="rest-form-group">
                <label>Tiêu đề sự kiện <span className="rest-required">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Tiệc Cưới Hoàng Gia"
                  value={eventForm.title}
                  onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              {/* Loại sự kiện */}
              <div className="rest-form-group">
                <label>Loại sự kiện</label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm((f) => ({ ...f, eventType: e.target.value }))}
                >
                  {EVENT_TYPES_LIST.map((ev) => (
                    <option key={ev.eventType} value={ev.eventType}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Giá */}
              <div className="rest-form-group">
                <label>Giá (VNĐ)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 5000000 (để trống = miễn phí)"
                  value={eventForm.price}
                  onChange={(e) => setEventForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              {/* Mô tả */}
              <div className="rest-form-group">
                <label>Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn về sự kiện"
                  value={eventForm.description}
                  onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              {/* Trạng thái */}
              <div className="rest-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={eventForm.isActive}
                    onChange={(e) => setEventForm((f) => ({ ...f, isActive: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Đang hoạt động
                </label>
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeEventModal} disabled={eventSubmitting}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit" disabled={eventSubmitting}>
                  {eventSubmitting ? 'Đang gửi…' : (editingEvent ? 'Lưu thay đổi' : 'Tạo sự kiện')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {serviceModalOpen && (
        <div className="rest-modal-overlay" onClick={closeServiceModal}>
          <div className="rest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeServiceModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitService} className="rest-modal-form">
              {serviceSubmitError && (
                <p style={{ color: '#c0392b', marginBottom: 12, fontSize: 14 }} role="alert">
                  {serviceSubmitError}
                </p>
              )}
              <div className="rest-form-group">
                <label>Ảnh dịch vụ</label>
                <div className="rest-blog-upload-wrap">
                  <label className="rest-blog-upload-zone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleBlogImageChange(f, setServiceForm, setServiceImageFile, setServiceImagePreview);
                      }}
                    />
                    {(serviceImagePreview || serviceForm.image) ? (
                      <div className="rest-blog-upload-preview">
                        <img
                          src={blogFormImageDisplaySrc(serviceImagePreview, serviceForm.image)}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="rest-blog-upload-remove"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            revokeBlogPreviewIfBlob(serviceImagePreview);
                            setServiceImageFile(null);
                            setServiceImagePreview('');
                            setServiceForm((f) => ({ ...f, image: '' }));
                          }}
                          aria-label="Xóa ảnh"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="rest-blog-upload-placeholder">
                        <FileImage size={36} strokeWidth={1.5} />
                        <span>Chọn ảnh</span>
                        <small>JPG, PNG, WebP – Tối đa 5MB</small>
                      </div>
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Hoặc đường dẫn / URL ảnh (API: image)"
                  value={serviceForm.image}
                  onChange={(e) => {
                    setServiceForm((f) => ({ ...f, image: e.target.value }));
                    revokeBlogPreviewIfBlob(serviceImagePreview);
                    setServiceImageFile(null);
                    setServiceImagePreview('');
                  }}
                  style={{ marginTop: 8 }}
                />
              </div>
              <div className="rest-form-group">
                <label>Tên dịch vụ <span className="rest-required">*</span></label>
                <input
                  type="text"
                  placeholder="VD: MC dẫn chương trình"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="rest-form-row2">
                <div className="rest-form-group">
                  <label>Giá (VNĐ) <span className="rest-required">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="VD: 2000000"
                    value={serviceForm.servicePrice}
                    onChange={(e) => setServiceForm((f) => ({ ...f, servicePrice: e.target.value }))}
                    required
                  />
                </div>
                <div className="rest-form-group">
                  <label>Đơn vị</label>
                  <input
                    type="text"
                    placeholder="VD: Buổi"
                    value={serviceForm.unit}
                    onChange={(e) => setServiceForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </div>
              <div className="rest-form-group">
                <label>Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn dịch vụ"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="rest-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={serviceForm.isAvailable}
                    onChange={(e) => setServiceForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                    style={{ marginRight: 8 }}
                  />
                  Đang kinh doanh (isAvailable)
                </label>
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeServiceModal} disabled={serviceSubmitting}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit" disabled={serviceSubmitting}>
                  {serviceSubmitting ? 'Đang gửi…' : (editingService ? 'Lưu thay đổi' : 'Tạo dịch vụ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {codeModalOpen && (
        <div className="rest-modal-overlay" onClick={closeCodeModal}>
          <div className="rest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingCode ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeCodeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitCode} className="rest-modal-form">
              {codeSubmitError && (
                <p style={{ color: '#c0392b', marginBottom: 12, fontSize: 14 }} role="alert">
                  {codeSubmitError}
                </p>
              )}
              <div className="rest-form-group">
                <label>Mã Code <span className="rest-required">*</span></label>
                <input type="text" placeholder="VD: LUNCH2023" value={codeForm.code} onChange={(e) => setCodeForm((f) => ({ ...f, code: e.target.value }))} required readOnly={!!editingCode} title={editingCode ? 'Mã code không đổi qua API cập nhật' : undefined} style={editingCode ? { opacity: 0.85 } : undefined} />
              </div>
              <div className="rest-form-group">
                <label>Loại giảm giá <span className="rest-required">*</span></label>
                <select value={codeForm.type} onChange={(e) => setCodeForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="percent">Phần trăm %</option>
                  <option value="fixed">Cố định (VNĐ)</option>
                  <option value="ship">Vận chuyển</option>
                </select>
              </div>
              <div className="rest-form-group">
                <label>Miêu tả</label>
                <textarea placeholder="Nhập mô tả ngắn cho chương trình giảm giá..." value={codeForm.description} onChange={(e) => setCodeForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="rest-form-group">
                <label>Giá trị giảm <span className="rest-required">*</span></label>
                <div className="rest-form-suffix">
                  <input type="text" placeholder="VD: 20" value={codeForm.value} onChange={(e) => setCodeForm((f) => ({ ...f, value: e.target.value }))} />
                  <span className="rest-suffix">VND</span>
                </div>
              </div>
              <div className="rest-form-row2">
                <div className="rest-form-group">
                  <label>Đơn tối thiểu</label>
                  <div className="rest-form-suffix">
                    <input type="text" value={codeForm.minOrder} onChange={(e) => setCodeForm((f) => ({ ...f, minOrder: e.target.value }))} />
                    <span className="rest-suffix">VND</span>
                  </div>
                </div>
                <div className="rest-form-group">
                  <label>Giảm tối đa</label>
                  <div className="rest-form-suffix">
                    <input type="text" value={codeForm.maxDiscount} onChange={(e) => setCodeForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
                    <span className="rest-suffix">VND</span>
                  </div>
                </div>
              </div>
              <div className="rest-form-row2">
                <div className="rest-form-group">
                  <label>Ngày bắt đầu <span className="rest-required">*</span></label>
                  <input type="date" value={codeForm.startDate} onChange={(e) => setCodeForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="rest-form-group">
                  <label>Ngày kết thúc <span className="rest-required">*</span></label>
                  <input type="date" value={codeForm.endDate} onChange={(e) => setCodeForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="rest-form-group">
                <label>Số lượng mã</label>
                <input type="text" placeholder="Số lượng tối đa" value={codeForm.quantity} onChange={(e) => setCodeForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeCodeModal} disabled={codeSubmitting}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit" disabled={codeSubmitting}>
                  {codeSubmitting ? 'Đang gửi…' : (editingCode ? 'Lưu thay đổi' : 'Tạo mã mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {blogModalOpen && (
        <div className="rest-modal-overlay" onClick={closeBlogModal}>
          <div className="rest-modal rest-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rest-modal-head">
              <h2 className="rest-modal-title">{editingBlog ? 'Chỉnh sửa bài viết Blog' : 'Tạo bài viết Blog mới'}</h2>
              <button type="button" className="rest-modal-close" onClick={closeBlogModal}><X size={20} /></button>
            </div>
            <p className="rest-modal-desc">Điền các thông tin dưới đây để đăng tải bài viết lên hệ thống</p>
            <form onSubmit={handleSubmitBlog} className="rest-modal-form">
              {blogSubmitError && (
                <p style={{ color: '#c0392b', marginBottom: 12, fontSize: 14 }} role="alert">
                  {blogSubmitError}
                </p>
              )}
              {!editingBlog && (
                <p className="rest-modal-desc" style={{ padding: '0 0 0.75rem', marginTop: '-0.5rem' }}>
                  Bài viết mới: ảnh bìa sẽ được upload lên Cloudinary, các trường còn lại gửi qua API POST /blogs.
                </p>
              )}
              <div className="rest-form-group">
                <label>Ảnh bìa bài viết</label>
                <div className="rest-blog-upload-wrap">
                  <label className="rest-blog-upload-zone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        handleBlogImageChange(f, setBlogForm, setBlogImageFile, setBlogImagePreview);
                      }}
                    />
                    {(blogImagePreview || blogForm.image) ? (
                      <div className="rest-blog-upload-preview">
                        <img
                          src={blogFormImageDisplaySrc(blogImagePreview, blogForm.image)}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="rest-blog-upload-remove"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            revokeBlogPreviewIfBlob(blogImagePreview);
                            setBlogImageFile(null);
                            setBlogImagePreview('');
                            setBlogForm((f) => ({ ...f, image: '' }));
                          }}
                          aria-label="Xóa ảnh"
                        >
                          <X size={14} />
                        </button>
                </div>
                    ) : (
                      <div className="rest-blog-upload-placeholder">
                        <FileImage size={36} strokeWidth={1.5} />
                        <span>Chọn ảnh bìa</span>
                        <small>JPG, PNG, WebP – Tối đa 5MB</small>
                      </div>
                    )}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Hoặc dán đường dẫn ảnh từ Cloudinary / URL"
                  value={blogForm.image}
                  onChange={(e) => {
                    setBlogForm((f) => ({ ...f, image: e.target.value }));
                    revokeBlogPreviewIfBlob(blogImagePreview);
                    setBlogImageFile(null);
                    setBlogImagePreview('');
                  }}
                  style={{ marginTop: 8 }}
                />
              </div>
              <div className="rest-form-group">
                <label>Tiêu đề bài viết <span className="rest-required">*</span></label>
                <input type="text" placeholder="Nhập tiêu đề thu hút người xem..." value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="rest-form-group">
                <label>Nội dung bài viết <span className="rest-required">*</span></label>
                <textarea placeholder="Có thể dùng HTML cho rich text..." value={blogForm.content} onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))} rows={6} required />
              </div>
              <div className="rest-form-row2">
              <div className="rest-form-group">
                  <label>Trạng thái</label>
                  <select value={blogForm.status} onChange={(e) => setBlogForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
              </div>
              <div className="rest-form-group">
                  <label>Ngày giờ xuất bản</label>
                  <input
                    type="datetime-local"
                    value={blogForm.publishedAt}
                    onChange={(e) => setBlogForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                  <small style={{ display: 'block', marginTop: 6, color: '#6b7280', fontSize: 12 }}>
                    API không chấp nhận thời điểm trong quá khứ — khi lưu sẽ tự điều chỉnh về thời điểm hiện tại nếu cần.
                  </small>
                </div>
              </div>
              <div className="rest-modal-actions">
                <button type="button" className="rest-modal-btn rest-modal-cancel" onClick={closeBlogModal} disabled={blogSubmitting}>Hủy</button>
                <button type="submit" className="rest-modal-btn rest-modal-submit" disabled={blogSubmitting}>
                  {blogSubmitting ? 'Đang gửi…' : (editingBlog ? 'Lưu thay đổi' : 'Đăng bài')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {blogDetailOpen && (
        <div className="rest-modal-overlay rest-modal-overlay--blog-detail" onClick={closeBlogDetailModal}>
          <div
            className="rest-blog-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rest-blog-detail-main-title"
          >
            {blogDetailLoading && (
              <div className="rest-blog-detail-loading rest-blog-detail-loading--full">Đang tải nội dung…</div>
            )}
            {!blogDetailLoading && blogDetailError && (
              <div className="rest-blog-detail-error-wrap">
                <p className="rest-blog-detail-error-text" role="alert">
                  {blogDetailError}
                </p>
                <button
                  type="button"
                  className="rest-btn-primary rest-blog-detail-retry"
                  onClick={() => blogDetailFetchId != null && openBlogDetail({ id: blogDetailFetchId })}
                >
                  Thử lại
                </button>
                <button type="button" className="rest-blog-detail-close-fab" onClick={closeBlogDetailModal} aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>
            )}
            {!blogDetailLoading && !blogDetailError && blogDetail && (() => {
              const imagePath = pickBlogImagePath(blogDetail);
              const coverUrl = resolveBlogImageUrl(imagePath);
              const statusStr = blogDetail.status != null && blogDetail.status !== '' ? String(blogDetail.status) : '—';
              const isPublished = String(blogDetail.status || '').toLowerCase() === 'published';
              const viewsStr = blogDetail.viewCount != null
                ? Number(blogDetail.viewCount).toLocaleString('vi-VN')
                : '—';
              const authorDisplay = pickBlogAuthorName(blogDetail) || '—';
              return (
                <div className="rest-blog-detail-layout">
                  <aside className={`rest-blog-detail-visual${coverUrl ? '' : ' rest-blog-detail-visual--placeholder'}`}>
                    {coverUrl ? (
                      <img className="rest-blog-detail-visual-img" src={coverUrl} alt="" loading="eager" decoding="async" />
                    ) : (
                      <div className="rest-blog-detail-visual-bg rest-blog-detail-visual-bg--fallback" aria-hidden />
                    )}
                    <div className="rest-blog-detail-visual-gradient" aria-hidden />
                    <div className="rest-blog-detail-visual-inner">
                      <div className="rest-blog-detail-tags">
                        <span>BLOG</span>
                        {statusStr !== '—' ? <span>{statusStr}</span> : null}
                      </div>
                      <h2 className="rest-blog-detail-visual-title">{blogDetail.title || '—'}</h2>
                    </div>
                  </aside>
                  <div className="rest-blog-detail-panel">
                    <button type="button" className="rest-blog-detail-close-fab" onClick={closeBlogDetailModal} aria-label="Đóng">
                      <X size={20} />
                    </button>
                    <div className="rest-blog-detail-panel-scroll">
                      <p className="rest-blog-detail-kicker">Mã bài viết</p>
                      <p className="rest-blog-detail-id">
                        #
                        {blogDetail.blogId != null ? `BLOG-${blogDetail.blogId}` : '—'}
                      </p>
                      <div className="rest-blog-detail-meta-row">
                        <div className="rest-blog-detail-meta-item">
                          <User size={18} strokeWidth={2} className="rest-blog-detail-meta-icon" aria-hidden />
                          <div className="rest-blog-detail-meta-text">
                            <span className="rest-blog-detail-meta-label">Tác giả</span>
                            <span className="rest-blog-detail-meta-value">{authorDisplay}</span>
                          </div>
                        </div>
                        <div className="rest-blog-detail-meta-item">
                          <span className={`rest-blog-detail-status-dot${isPublished ? ' rest-blog-detail-status-dot--live' : ''}`} aria-hidden />
                          <div className="rest-blog-detail-meta-text">
                            <span className="rest-blog-detail-meta-label">Trạng thái</span>
                            <span className="rest-blog-detail-meta-value">{statusStr}</span>
                          </div>
                        </div>
                        <div className="rest-blog-detail-meta-item">
                          <Eye size={18} strokeWidth={2} className="rest-blog-detail-meta-icon" aria-hidden />
                          <div className="rest-blog-detail-meta-text">
                            <span className="rest-blog-detail-meta-label">Lượt xem</span>
                            <span className="rest-blog-detail-meta-value">{viewsStr}</span>
                          </div>
                        </div>
                      </div>
                      <div className="rest-blog-detail-submeta">
                        <span>Xuất bản: {formatBlogDateTime(blogDetail.publishedAt)}</span>
                        {blogDetail.authorId != null ? <span>Author ID: {blogDetail.authorId}</span> : null}
                        {imagePath ? (
                          <span className="rest-blog-detail-submeta-path" title={imagePath}>
                            Ảnh: {imagePath}
                          </span>
                        ) : null}
                      </div>
                      <h1 id="rest-blog-detail-main-title" className="rest-blog-detail-main-title">
                        {blogDetail.title || '—'}
                      </h1>
                      <div className="rest-blog-detail-prose">
                        {blogContentLooksLikeHtml(blogDetail.content) ? (
                          <div
                            className="rest-blog-detail-html"
                            dangerouslySetInnerHTML={{ __html: String(blogDetail.content || '') }}
                          />
                        ) : (
                          <div className="rest-blog-detail-plain">
                            {blogDetail.content != null && blogDetail.content !== '' ? String(blogDetail.content) : '—'}
                          </div>
                        )}
                      </div>
                      {Object.keys(blogDetail).some((k) => !BLOG_DETAIL_KNOWN_KEYS.has(k)) && (
                        <div className="rest-blog-detail-extras">
                          <div className="rest-blog-detail-extras-label">Trường bổ sung</div>
                          <dl className="rest-blog-detail-extras-dl">
                            {Object.entries(blogDetail)
                              .filter(([k]) => !BLOG_DETAIL_KNOWN_KEYS.has(k))
                              .map(([k, v]) => (
                                <React.Fragment key={k}>
                                  <dt>{k}</dt>
                                  <dd>
                                    {v != null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                                  </dd>
                                </React.Fragment>
                              ))}
                          </dl>
                        </div>
                      )}
                    </div>
                    <footer className="rest-blog-detail-footer">
                      <div className="rest-blog-detail-footer-left">
                        <button type="button" className="rest-blog-detail-btn-secondary" onClick={openEditFromBlogDetail}>
                          <Pencil size={16} aria-hidden />
                          Chỉnh sửa bài
                        </button>
                        <button type="button" className="rest-blog-detail-btn-secondary" onClick={shareBlogDetail}>
                          <Share2 size={16} aria-hidden />
                          Chia sẻ
                        </button>
                      </div>
                      <button type="button" className="rest-blog-detail-btn-primary" onClick={closeBlogDetailModal}>
                        Đóng chi tiết
                      </button>
                    </footer>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurantPage;
