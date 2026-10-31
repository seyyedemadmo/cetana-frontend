<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="visible" class="tour-backdrop" @click.self="maybeSkip">
        <div class="tour-card">

          <!-- Top bar: progress dots + skip -->
          <div class="tour-topbar">
            <div class="tour-dots">
              <span
                v-for="(_, i) in steps"
                :key="i"
                class="tour-dot"
                :class="{ active: i === index, done: i < index }"
                @click="jumpTo(i)"
              />
            </div>
            <button class="tour-skip-x" @click="finish" title="بستن">✕</button>
          </div>

          <!-- Illustration -->
          <div class="tour-illustration">
            <component :is="currentStep.icon" class="tour-icon-svg" />
          </div>

          <!-- Step badge -->
          <div class="tour-badge">
            <span class="tour-badge-step">مرحله {{ index + 1 }}</span>
            <span class="tour-badge-of">از {{ steps.length }}</span>
          </div>

          <!-- Text -->
          <h2 class="tour-title" dir="rtl">{{ currentStep.title }}</h2>
          <p class="tour-desc" dir="rtl">{{ currentStep.desc }}</p>

          <!-- Navigation -->
          <div class="tour-nav">
            <button class="tour-btn ghost" @click="finish">رد کردن</button>
            <div class="tour-nav-end">
              <button v-if="index > 0" class="tour-btn outline" @click="prev">← قبلی</button>
              <button class="tour-btn primary" @click="next">
                <span v-if="index < steps.length - 1">بعدی &nbsp;→</span>
                <span v-else>🚀&nbsp; شروع کنید!</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const STORAGE_KEY = 'cetana.tour.done'
const visible = ref(false)
const index = ref(0)

/* ── SVG illustrations (inline functional components) ── */
const SvgWelcome = () =>
  h('svg', { viewBox: '0 0 200 140', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('circle', { cx: 100, cy: 60, r: 48, fill: '#eaf5ee', stroke: '#15803d', 'stroke-width': 3 }),
    h('circle', { cx: 100, cy: 60, r: 34, fill: '#15803d' }),
    h('text', { x: 100, y: 66, 'text-anchor': 'middle', fill: 'white', 'font-size': 26, 'font-weight': 'bold', 'font-family': 'sans-serif' }, 'ص'),
    h('text', { x: 100, y: 125, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 15, 'font-weight': '700', 'font-family': 'sans-serif' }, 'سامانه ستانا'),
    h('ellipse', { cx: 60, cy: 48, rx: 8, ry: 8, fill: '#d9a441', opacity: 0.7 }),
    h('ellipse', { cx: 140, cy: 72, rx: 5, ry: 5, fill: '#d9a441', opacity: 0.5 }),
    h('ellipse', { cx: 148, cy: 45, rx: 4, ry: 4, fill: '#15803d', opacity: 0.4 }),
    h('ellipse', { cx: 55, cy: 78, rx: 3, ry: 3, fill: '#15803d', opacity: 0.3 }),
  ])

const SvgDashboard = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('rect', { x: 10, y: 10, width: 180, height: 110, rx: 10, fill: '#faf6ee', stroke: '#e0ddd5', 'stroke-width': 1.5 }),
    // 4 stat cards
    ...[
      { x: 18, label: 'رزروها', val: '12', color: '#15803d' },
      { x: 62, label: 'سفارش‌ها', val: '5', color: '#d9a441' },
      { x: 106, label: 'فرآوری', val: '3', color: '#2563eb' },
      { x: 150, label: 'پرداخت', val: '2', color: '#dc2626' },
    ].map(({ x, label, val, color }) => [
      h('rect', { x, y: 28, width: 38, height: 48, rx: 6, fill: 'white', stroke: '#e5e7eb', 'stroke-width': 1 }),
      h('text', { x: x + 19, y: 52, 'text-anchor': 'middle', fill: color, 'font-size': 16, 'font-weight': 'bold', 'font-family': 'sans-serif' }, val),
      h('text', { x: x + 19, y: 66, 'text-anchor': 'middle', fill: '#6b7280', 'font-size': 5.5, 'font-family': 'sans-serif' }, label),
    ]),
    h('rect', { x: 18, y: 88, width: 164, height: 22, rx: 5, fill: 'white', stroke: '#e5e7eb', 'stroke-width': 1 }),
    h('text', { x: 100, y: 103, 'text-anchor': 'middle', fill: '#9ca3af', 'font-size': 7, 'font-family': 'sans-serif' }, 'نمای کلی عملیات واحد فرآوری'),
  ])

const SvgReservation = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('rect', { x: 30, y: 10, width: 140, height: 110, rx: 8, fill: 'white', stroke: '#e5e7eb', 'stroke-width': 1.5 }),
    // Calendar header
    h('rect', { x: 30, y: 10, width: 140, height: 24, rx: '8 8 0 0', fill: '#15803d' }),
    h('text', { x: 100, y: 26, 'text-anchor': 'middle', fill: 'white', 'font-size': 9, 'font-family': 'sans-serif' }, '📅  انتخاب اسلات زمانی'),
    // Grid of slots
    ...[
      { x: 40, y: 44, avail: true },  { x: 84, y: 44, avail: true },  { x: 128, y: 44, avail: false },
      { x: 40, y: 72, avail: true },  { x: 84, y: 72, avail: false }, { x: 128, y: 72, avail: true, selected: true },
      { x: 40, y: 100, avail: false }, { x: 84, y: 100, avail: true }, { x: 128, y: 100, avail: true },
    ].map(({ x, y, avail, selected }) =>
      h('rect', {
        x, y, width: 36, height: 20, rx: 4,
        fill: selected ? '#15803d' : avail ? '#eaf5ee' : '#f3f4f6',
        stroke: selected ? '#0f6630' : avail ? '#b3d8c0' : '#e5e7eb',
        'stroke-width': 1.5,
      })
    ),
    h('text', { x: 146, y: 86, 'text-anchor': 'middle', fill: 'white', 'font-size': 7, 'font-family': 'sans-serif' }, '08:30'),
  ])

const SvgApprove = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('rect', { x: 30, y: 20, width: 140, height: 90, rx: 10, fill: 'white', stroke: '#e5e7eb', 'stroke-width': 1.5 }),
    h('text', { x: 100, y: 48, 'text-anchor': 'middle', fill: '#374151', 'font-size': 8, 'font-family': 'sans-serif' }, 'رزرو آقای احمدی — ۸ صبح'),
    h('rect', { x: 42, y: 55, width: 34, height: 14, rx: 5, fill: '#dcfce7', stroke: '#86efac', 'stroke-width': 1 }),
    h('text', { x: 59, y: 65, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 7.5, 'font-family': 'sans-serif' }, '✓ تأیید'),
    h('rect', { x: 82, y: 55, width: 34, height: 14, rx: 5, fill: '#fef9c3', stroke: '#fde047', 'stroke-width': 1 }),
    h('text', { x: 99, y: 65, 'text-anchor': 'middle', fill: '#854d0e', 'font-size': 7.5, 'font-family': 'sans-serif' }, '✕ رد'),
    h('rect', { x: 122, y: 55, width: 40, height: 14, rx: 5, fill: '#fee2e2', stroke: '#fca5a5', 'stroke-width': 1 }),
    h('text', { x: 142, y: 65, 'text-anchor': 'middle', fill: '#991b1b', 'font-size': 7.5, 'font-family': 'sans-serif' }, '⊘ لغو'),
    // SMS
    h('rect', { x: 50, y: 80, width: 100, height: 22, rx: 6, fill: '#f0fdf4', stroke: '#bbf7d0', 'stroke-width': 1 }),
    h('text', { x: 100, y: 91, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 7, 'font-family': 'sans-serif' }, '📱 پیامک تأیید به مشتری ارسال شد'),
    h('text', { x: 100, y: 100, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 6, 'font-family': 'sans-serif' }, 'رزرو شما تأیید شد — ۲۵ اکتبر ساعت ۸:۰۰'),
  ])

const SvgWeighing = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    // Scale base
    h('rect', { x: 60, y: 80, width: 80, height: 12, rx: 4, fill: '#d1d5db' }),
    h('rect', { x: 88, y: 40, width: 24, height: 40, rx: 3, fill: '#9ca3af' }),
    h('rect', { x: 40, y: 32, width: 120, height: 12, rx: 6, fill: '#6b7280' }),
    // Left pan
    h('line', { x1: 60, y1: 44, x2: 50, y2: 60, stroke: '#6b7280', 'stroke-width': 2 }),
    h('rect', { x: 28, y: 60, width: 44, height: 10, rx: 5, fill: '#d9a441' }),
    h('text', { x: 50, y: 70, 'text-anchor': 'middle', fill: '#78350f', 'font-size': 6, 'font-family': 'sans-serif' }, 'ناخالص 5800'),
    // Right pan
    h('line', { x1: 140, y1: 44, x2: 150, y2: 60, stroke: '#6b7280', 'stroke-width': 2 }),
    h('rect', { x: 128, y: 60, width: 44, height: 10, rx: 5, fill: '#93c5fd' }),
    h('text', { x: 150, y: 70, 'text-anchor': 'middle', fill: '#1d4ed8', 'font-size': 6, 'font-family': 'sans-serif' }, 'خالص 5000'),
    // Net weight label
    h('rect', { x: 55, y: 98, width: 90, height: 18, rx: 5, fill: '#dcfce7', stroke: '#86efac', 'stroke-width': 1 }),
    h('text', { x: 100, y: 111, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 8, 'font-weight': 'bold', 'font-family': 'sans-serif' }, '⚖ وزن خالص: ۵۰۰۰ کیلوگرم'),
    h('text', { x: 100, y: 22, 'text-anchor': 'middle', fill: '#374151', 'font-size': 9, 'font-family': 'sans-serif' }, 'مرحله توزین'),
  ])

const SvgProcessing = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    // Flow steps
    ...[
      { x: 10, label: 'دسته‌بندی', color: '#15803d', status: '✓' },
      { x: 58, label: 'شستشو', color: '#2563eb', status: '▶' },
      { x: 106, label: 'خشک‌کردن', color: '#9ca3af', status: '○' },
      { x: 154, label: 'بوداده', color: '#9ca3af', status: '○' },
    ].map(({ x, label, color, status }, i) => [
      h('rect', { x, y: 40, width: 42, height: 50, rx: 7, fill: color === '#9ca3af' ? '#f9fafb' : color + '15', stroke: color, 'stroke-width': 2 }),
      h('text', { x: x + 21, y: 62, 'text-anchor': 'middle', fill: color, 'font-size': 14, 'font-family': 'sans-serif' }, status),
      h('text', { x: x + 21, y: 80, 'text-anchor': 'middle', fill: color, 'font-size': 5.5, 'font-family': 'sans-serif' }, label),
      i < 3 ? h('path', { d: `M ${x + 42} 65 L ${x + 58} 65`, stroke: '#d1d5db', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', 'marker-end': 'url(#arr)' }) : null,
    ]),
    h('defs', {}, [
      h('marker', { id: 'arr', markerWidth: 6, markerHeight: 6, refX: 3, refY: 3, orient: 'auto' }, [
        h('path', { d: 'M0,0 L6,3 L0,6 Z', fill: '#d1d5db' }),
      ]),
    ]),
    h('text', { x: 100, y: 18, 'text-anchor': 'middle', fill: '#374151', 'font-size': 9, 'font-family': 'sans-serif' }, 'اجرای مراحل فرآوری'),
    h('rect', { x: 25, y: 100, width: 150, height: 18, rx: 5, fill: '#eff6ff', stroke: '#bfdbfe', 'stroke-width': 1 }),
    h('text', { x: 100, y: 112, 'text-anchor': 'middle', fill: '#1d4ed8', 'font-size': 7, 'font-family': 'sans-serif' }, 'اپراتور هر مرحله را شروع، توقف یا تکمیل می‌کند'),
  ])

const SvgPayment = () =>
  h('svg', { viewBox: '0 0 200 130', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    // Credit card style
    h('rect', { x: 30, y: 20, width: 140, height: 70, rx: 10, fill: '#15803d' }),
    h('rect', { x: 30, y: 56, width: 140, height: 2, fill: '#0f6630' }),
    h('text', { x: 50, y: 44, fill: 'white', 'font-size': 9, 'font-family': 'monospace' }, 'ستانا پرداخت'),
    h('text', { x: 50, y: 68, fill: 'white', 'font-size': 8, 'font-family': 'monospace' }, '**** **** **** 4242'),
    h('text', { x: 50, y: 82, fill: '#bbf7d0', 'font-size': 7, 'font-family': 'monospace' }, 'مبلغ: ۴۹,۵۰۰,۰۰۰ ریال'),
    h('circle', { cx: 155, cy: 38, r: 12, fill: '#d9a441', opacity: 0.8 }),
    h('circle', { cx: 165, cy: 38, r: 12, fill: '#fbbf24', opacity: 0.6 }),
    // Invoice line
    h('rect', { x: 30, y: 100, width: 140, height: 22, rx: 6, fill: '#fefce8', stroke: '#fde047', 'stroke-width': 1 }),
    h('text', { x: 100, y: 112, 'text-anchor': 'middle', fill: '#854d0e', 'font-size': 7.5, 'font-family': 'sans-serif' }, '🧾  فاکتور صادر شد — همگام‌سازی با Odoo ✓'),
  ])

const SvgDone = () =>
  h('svg', { viewBox: '0 0 200 140', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }, [
    h('circle', { cx: 100, cy: 65, r: 48, fill: '#dcfce7', stroke: '#86efac', 'stroke-width': 3 }),
    h('circle', { cx: 100, cy: 65, r: 36, fill: '#15803d' }),
    h('path', { d: 'M82 65 L94 77 L118 53', stroke: 'white', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('text', { x: 100, y: 128, 'text-anchor': 'middle', fill: '#15803d', 'font-size': 13, 'font-weight': 'bold', 'font-family': 'sans-serif' }, 'آماده‌اید! 🎉'),
    // Stars
    ...[
      [40, 28], [160, 30], [30, 80], [172, 75], [55, 115], [148, 112]
    ].map(([cx, cy]) =>
      h('text', { x: cx, y: cy, 'text-anchor': 'middle', 'font-size': 10 }, '✦')
    ),
  ])

/* ── Tour step definitions ── */
const steps = [
  {
    icon: SvgWelcome,
    title: 'به سامانه ستانا خوش آمدید 🌰',
    desc: 'ستانا یک سیستم هوشمند مدیریت رزرو و فرآوری پسته است. این راهنما شما را قدم‌به‌قدم با امکانات سیستم آشنا می‌کند. خواندنش فقط یک دقیقه طول می‌کشد!',
  },
  {
    icon: SvgDashboard,
    title: 'داشبورد — نمای کلی عملیات',
    desc: 'بعد از ورود، داشبورد وضعیت لحظه‌ای سیستم را نشان می‌دهد: رزروهای فعال، سفارش‌های در حال فرآوری، و پرداخت‌های در انتظار. همه چیز را از اینجا ببینید.',
  },
  {
    icon: SvgReservation,
    title: '📅 ثبت رزرو (مشتری)',
    desc: 'از منوی «رزروها» یک اسلات زمانی خالی انتخاب کنید و رزرو ثبت کنید. اسلات‌های سبز خالی هستند. بعد از ثبت، رزرو شما منتظر تأیید مدیر می‌ماند.',
  },
  {
    icon: SvgApprove,
    title: '✅ تأیید رزرو (مدیر)',
    desc: 'مدیر رزرو شما را بررسی می‌کند. در صورت تأیید، یک پیامک به شماره شما ارسال می‌شود. در صورت رد، ظرفیت اسلات آزاد می‌شود تا دیگران بتوانند رزرو کنند.',
  },
  {
    icon: SvgWeighing,
    title: '⚖️ توزین (اپراتور)',
    desc: 'روز مراجعه، اپراتور وزن ناخالص (کامیون + بار) و وزن تاره (کامیون خالی) را ثبت می‌کند. وزن خالص محاسبه شده پایه محاسبه قیمت است و قابل تغییر نیست.',
  },
  {
    icon: SvgProcessing,
    title: '🔄 مراحل فرآوری',
    desc: 'بعد از توزین، مراحل فرآوری (دسته‌بندی، شستشو، خشک‌کردن، بوداده) انتخاب و قیمت محاسبه می‌شود. اپراتورها هر مرحله را شروع، متوقف یا تکمیل می‌کنند.',
  },
  {
    icon: SvgPayment,
    title: '💵 پرداخت و فاکتور',
    desc: 'بعد از تکمیل فرآوری، پرداخت ثبت و تأیید می‌شود. فاکتور به صورت خودکار صادر شده و با سیستم حسابداری Odoo همگام‌سازی می‌شود.',
  },
  {
    icon: SvgDone,
    title: 'همه چیز آماده است!',
    desc: 'حالا با سیستم ستانا آشنا هستید. برای راهنمای دقیق‌تر هر صفحه، روی آیکون 📖 راهنما در هدر کلیک کنید، یا به بخش «راهنمای کاربر» در منو بروید.',
  },
]

const currentStep = computed(() => steps[index.value])

function next() {
  if (index.value < steps.length - 1) {
    index.value++
  } else {
    finish()
  }
}

function prev() {
  if (index.value > 0) index.value--
}

function jumpTo(i) {
  index.value = i
}

function finish() {
  visible.value = false
  localStorage.setItem(STORAGE_KEY, '1')
}

function maybeSkip() {
  // clicking backdrop doesn't close (prevents accidental close)
}

/* expose for parent to re-open tour */
function open() {
  index.value = 0
  visible.value = true
}

defineExpose({ open })

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    // slight delay so layout settles
    setTimeout(() => { visible.value = true }, 900)
  }
})
</script>

<style scoped>
.tour-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 32, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.tour-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Dark mode */
:global(html.dark) .tour-card {
  background: #1b2733;
  color: #e7edf3;
}

.tour-topbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 0;
}

.tour-dots {
  display: flex;
  gap: 6px;
}

.tour-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.25s ease;
}
.tour-dot.done { background: #86efac; }
.tour-dot.active { background: #15803d; width: 22px; border-radius: 4px; }

.tour-skip-x {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.2s;
}
.tour-skip-x:hover { background: #f3f4f6; color: #374151; }
:global(html.dark) .tour-skip-x:hover { background: #374151; color: #e5e7eb; }

.tour-illustration {
  margin: 20px 0 8px;
  width: 200px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tour-icon-svg {
  width: 100%;
  height: 100%;
}

.tour-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #eaf5ee;
  border: 1px solid #b3d8c0;
  border-radius: 20px;
  padding: 3px 12px;
  margin-bottom: 12px;
}
:global(html.dark) .tour-badge { background: #1a3d29; border-color: #2d6147; }

.tour-badge-step {
  font-size: 12px;
  font-weight: 700;
  color: #15803d;
  font-family: sans-serif;
}
.tour-badge-of {
  font-size: 11px;
  color: #6b7280;
  font-family: sans-serif;
}
:global(html.dark) .tour-badge-of { color: #9ca3af; }

.tour-title {
  font-size: 1.22rem;
  font-weight: 800;
  text-align: center;
  margin: 0 24px 10px;
  color: #111827;
  line-height: 1.5;
  font-family: 'Segoe UI', Tahoma, sans-serif;
}
:global(html.dark) .tour-title { color: #f1f5f9; }

.tour-desc {
  font-size: 0.88rem;
  text-align: center;
  color: #4b5563;
  line-height: 1.8;
  margin: 0 28px 24px;
  font-family: 'Segoe UI', Tahoma, sans-serif;
}
:global(html.dark) .tour-desc { color: #94a3b8; }

.tour-nav {
  width: 100%;
  padding: 16px 22px 22px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
:global(html.dark) .tour-nav { border-top-color: #2d3748; }

.tour-nav-end {
  display: flex;
  gap: 8px;
}

.tour-btn {
  border: none;
  border-radius: 10px;
  padding: 9px 20px;
  font-size: 0.87rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  white-space: nowrap;
}

.tour-btn.primary {
  background: #15803d;
  color: white;
  box-shadow: 0 2px 8px rgba(21, 128, 61, 0.35);
}
.tour-btn.primary:hover { background: #0f6630; transform: translateY(-1px); }

.tour-btn.outline {
  background: transparent;
  border: 1.5px solid #d1d5db;
  color: #374151;
}
.tour-btn.outline:hover { border-color: #9ca3af; background: #f9fafb; }
:global(html.dark) .tour-btn.outline { border-color: #4b5563; color: #cbd5e1; }
:global(html.dark) .tour-btn.outline:hover { background: #2d3748; }

.tour-btn.ghost {
  background: transparent;
  color: #9ca3af;
}
.tour-btn.ghost:hover { color: #6b7280; }

/* Transitions */
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.tour-fade-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.tour-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
