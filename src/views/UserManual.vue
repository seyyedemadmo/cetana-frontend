<template>
  <div class="manual-layout" :dir="dir">

    <!-- Sidebar TOC -->
    <aside class="manual-sidebar" :class="{ open: sidebarOpen }">
      <div class="manual-toc-title">📋 فهرست مطالب</div>
      <nav>
        <a
          v-for="sec in sections"
          :key="sec.id"
          :href="'#' + sec.id"
          class="manual-toc-link"
          :class="{ active: activeSec === sec.id }"
          @click.prevent="scrollTo(sec.id)"
        >
          <span class="toc-icon">{{ sec.icon }}</span>
          {{ sec.title }}
        </a>
      </nav>
      <div class="manual-tour-cta" @click="openTour">
        🎓 شروع آموزش تعاملی
      </div>
    </aside>

    <!-- Mobile toggle -->
    <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
      <span>{{ sidebarOpen ? '✕' : '☰' }}</span> فهرست
    </button>

    <!-- Main content -->
    <main class="manual-content" @scroll="onScroll" ref="contentEl">

      <!-- ─── INTRO ─── -->
      <section id="intro" class="manual-section">
        <div class="section-hero">
          <div class="hero-logo">
            <div class="hero-dot"></div>
            <span class="hero-name">ستانا</span>
          </div>
          <h1>راهنمای کاربری سامانه ستانا</h1>
          <p class="hero-sub">سیستم هوشمند مدیریت رزرو و فرآوری پسته</p>
          <div class="hero-tags">
            <span class="htag">🌰 فرآوری پسته</span>
            <span class="htag">📅 رزرواسیون</span>
            <span class="htag">⚙️ گردش‌کار پویا</span>
            <span class="htag">🧾 یکپارچه با Odoo</span>
          </div>
        </div>

        <div class="info-box">
          <div class="info-box-icon">💡</div>
          <div>
            <strong>ستانا چیست؟</strong> یک پلتفرم کامل برای مدیریت فرآیند دریافت، توزین، فرآوری و تحویل پسته است.
            از لحظه‌ای که مشتری رزرو می‌زند تا زمانی که فاکتور نهایی صادر می‌شود، همه چیز در این سیستم ردیابی می‌شود.
          </div>
        </div>
      </section>

      <!-- ─── ROLES ─── -->
      <section id="roles" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">👥</span> نقش‌های کاربری</h2>
        <p class="section-intro">هر کاربر یک یا چند نقش دارد که مشخص می‌کند چه صفحاتی می‌بیند و چه کارهایی می‌تواند انجام دهد.</p>

        <div class="roles-grid">
          <div class="role-card" v-for="r in roles" :key="r.slug" :style="`border-top: 3px solid ${r.color}`">
            <div class="role-icon" :style="`background: ${r.color}18; color: ${r.color}`">{{ r.icon }}</div>
            <div class="role-name">{{ r.name }}</div>
            <ul class="role-perms">
              <li v-for="p in r.perms" :key="p">{{ p }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ─── PROCESS FLOW ─── -->
      <section id="flow" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">🗺️</span> فرایند کلی سیستم</h2>
        <p class="section-intro">از رزرو تا فاکتور — این جریان کلی عملیات است:</p>

        <div class="flow-diagram">
          <div
            v-for="(step, i) in flowSteps"
            :key="i"
            class="flow-step"
            :style="`border-color: ${step.color}; background: ${step.color}0d`"
          >
            <div class="flow-step-num" :style="`background: ${step.color}; color: white`">{{ i + 1 }}</div>
            <div class="flow-step-icon">{{ step.icon }}</div>
            <div class="flow-step-title" :style="`color: ${step.color}`">{{ step.title }}</div>
            <div class="flow-step-actor">{{ step.actor }}</div>
            <div class="flow-step-desc">{{ step.desc }}</div>
            <div v-if="i < flowSteps.length - 1" class="flow-arrow">↓</div>
          </div>
        </div>
      </section>

      <!-- ─── CUSTOMER GUIDE ─── -->
      <section id="customer" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">🧑‍💼</span> راهنمای مشتری</h2>

        <!-- Login -->
        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۱</div>
            <h3>ورود به سیستم</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>آدرس سامانه را در مرورگر وارد کنید. صفحه ورود را می‌بینید.</p>
              <ol>
                <li>نام کاربری خود را وارد کنید</li>
                <li>رمز عبور را وارد کنید</li>
                <li>روی «ورود» کلیک کنید</li>
              </ol>
              <div class="tip-box">💡 اگر رمز عبور ندارید، با مدیر سیستم تماس بگیرید.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 24px; text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-bottom: 20px;">🌰 ستانا</div>
                  <div class="mockup-field">نام کاربری</div>
                  <div class="mockup-field">رمز عبور ••••••</div>
                  <div class="mockup-btn-green">ورود</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Reservation -->
        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۲</div>
            <h3>ثبت رزرو جدید</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>از منوی سمت چپ روی «رزروها» کلیک کنید، سپس دکمه «رزرو جدید» را بزنید.</p>
              <ol>
                <li>یک عنوان برای رزرو وارد کنید (مثلاً «دسته برداشت پاییزی»)</li>
                <li>از لیست کشویی، یک اسلات زمانی <strong>خالی</strong> انتخاب کنید</li>
                <li>روی «ذخیره» کلیک کنید</li>
              </ol>
              <div class="tip-box">📌 بعد از ذخیره، رزرو شما وضعیت <span class="status-badge pending">در انتظار</span> دارد و منتظر تأیید مدیر است.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 16px">
                  <div class="mockup-dialog-title">رزرو جدید</div>
                  <div class="mockup-label">عنوان</div>
                  <div class="mockup-field-filled">دسته برداشت پاییزی ۱</div>
                  <div class="mockup-label">اسلات زمانی</div>
                  <div class="mockup-field-filled">۲۵ اکتبر · ۰۸:۰۰  (۲ جای خالی)</div>
                  <div style="display:flex; gap:8px; margin-top: 12px; justify-content: flex-end">
                    <div class="mockup-btn-outline">انصراف</div>
                    <div class="mockup-btn-green">ذخیره</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Track status -->
        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۳</div>
            <h3>پیگیری وضعیت رزرو</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>در صفحه «رزروها» می‌توانید وضعیت رزروهای خود را ببینید:</p>
              <div class="status-table">
                <div class="st-row" v-for="s in reservationStatuses" :key="s.key">
                  <span class="status-badge" :class="s.key">{{ s.label }}</span>
                  <span class="st-desc">{{ s.desc }}</span>
                </div>
              </div>
              <div class="tip-box">📱 بعد از تأیید، یک پیامک به موبایل شما ارسال می‌شود.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-table-header">
                    <span>عنوان</span><span>تاریخ</span><span>وضعیت</span>
                  </div>
                  <div class="mockup-table-row">
                    <span>دسته پاییزی</span>
                    <span>۱۴۰۵/۰۸/۰۳</span>
                    <span class="status-badge confirmed">تأیید شد</span>
                  </div>
                  <div class="mockup-table-row">
                    <span>محصول رفسنجان</span>
                    <span>۱۴۰۵/۰۸/۰۴</span>
                    <span class="status-badge pending">در انتظار</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── ADMIN GUIDE ─── -->
      <section id="admin" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">🔑</span> راهنمای مدیر</h2>

        <!-- Setup -->
        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۱</div>
            <h3>راه‌اندازی اولیه — اسلات‌های زمانی</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>قبل از اینکه مشتریان بتوانند رزرو کنند، باید اسلات‌های زمانی ایجاد کنید:</p>
              <ol>
                <li>به «رزروها» → برگه «برنامه روز» بروید</li>
                <li>برای هر روز کاری، ظرفیت و ساعت کاری تعریف کنید</li>
                <li>به برگه «اسلات‌ها» بروید و دکمه «تولید اسلات‌ها» را بزنید</li>
                <li>تأسیسات و تاریخ را انتخاب کنید — سیستم اسلات‌ها را خودکار می‌سازد</li>
              </ol>
              <div class="tip-box">⚙️ مدت هر اسلات از «تنظیمات» قابل تغییر است (پیش‌فرض: ۳۰ دقیقه)</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-dialog-title" style="font-size:11px">تولید اسلات‌های زمانی</div>
                  <div class="mockup-label">تأسیسات</div>
                  <div class="mockup-field-filled">کارخانه فرآوری مرکزی کرمان</div>
                  <div class="mockup-label">تاریخ</div>
                  <div class="mockup-field-filled">۱۴۰۵/۰۸/۰۳</div>
                  <div class="info-hint">از تنظیمات: ۰۸:۰۰ تا ۱۷:۰۰ · ۳۰ دقیقه</div>
                  <div style="text-align:left; margin-top:10px">
                    <div class="mockup-btn-green" style="font-size:10px">تولید ← ۱۸ اسلات ایجاد شد</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Approve -->
        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۲</div>
            <h3>تأیید یا رد رزروها</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>رزروهای با وضعیت <span class="status-badge pending">در انتظار</span> نیاز به بررسی دارند:</p>
              <ul>
                <li><strong>تأیید:</strong> رزرو تأیید می‌شود و پیامک به مشتری ارسال می‌شود</li>
                <li><strong>رد:</strong> رزرو رد می‌شود و ظرفیت اسلات آزاد می‌شود</li>
                <li><strong>لغو:</strong> رزرو تأییدشده را می‌توانید لغو کنید (تا قبل از توزین)</li>
              </ul>
              <div class="warning-box">⚠️ رزروی که وزن‌کشی شده دیگر قابل لغو نیست.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-table-row" style="gap: 6px; align-items: center; flex-wrap: wrap">
                    <span style="font-size:10px; flex:1">رزرو احمدی · ۲۵ اکتبر ۸ صبح</span>
                    <span class="status-badge pending" style="font-size:8px">در انتظار</span>
                  </div>
                  <div style="display:flex; gap:6px; margin-top:10px; flex-wrap: wrap">
                    <div class="mockup-btn-green" style="font-size:9px">✓ تأیید</div>
                    <div class="mockup-btn-warn" style="font-size:9px">✕ رد</div>
                    <div class="mockup-btn-danger" style="font-size:9px">⊘ لغو</div>
                  </div>
                  <div class="info-hint" style="margin-top:10px">📱 بعد از تأیید: پیامک ارسال می‌شود</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── OPERATOR GUIDE ─── -->
      <section id="operator" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">👷</span> راهنمای اپراتور</h2>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۱</div>
            <h3>ایجاد سفارش از رزرو</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>وقتی مشتری می‌رسد، یک سفارش فرآوری از رزرو تأییدشده‌اش بسازید:</p>
              <ol>
                <li>به «سفارش‌ها» بروید و «سفارش جدید» بزنید</li>
                <li>رزرو مشتری را از لیست انتخاب کنید</li>
                <li>سفارش با شماره خودکار مثل <code>STN-2026-000042</code> ایجاد می‌شود</li>
              </ol>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-dialog-title" style="font-size:11px">سفارش جدید</div>
                  <div class="mockup-label">رزرو</div>
                  <div class="mockup-field-filled">احمدی — ۲۵ اکتبر ۸:۰۰ (تأییدشده)</div>
                  <div class="mockup-btn-green" style="margin-top:10px; font-size:10px">✓ سفارش STN-2026-000042 ایجاد شد</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۲</div>
            <h3>توزین و ثبت وزن</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>روی سفارش کلیک کنید و «وزن‌کشی» را بزنید:</p>
              <div class="formula-box">
                <div class="formula-item"><strong>وزن ناخالص:</strong> کامیون + بار = ۵۸۰۰ کیلو</div>
                <div class="formula-sep">−</div>
                <div class="formula-item"><strong>وزن تاره:</strong> کامیون خالی = ۸۰۰ کیلو</div>
                <div class="formula-sep">=</div>
                <div class="formula-result"><strong>وزن خالص:</strong> ۵۰۰۰ کیلوگرم 🔒</div>
              </div>
              <div class="warning-box">🔒 وزن خالص پس از ثبت قابل تغییر نیست.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-dialog-title" style="font-size:11px">ثبت وزن‌کشی</div>
                  <div class="mockup-label">وزن ناخالص (کیلوگرم)</div>
                  <div class="mockup-field-filled">5800</div>
                  <div class="mockup-label">وزن تاره (کیلوگرم)</div>
                  <div class="mockup-field-filled">800</div>
                  <div class="info-hint" style="background:#dcfce7; border-color:#86efac; color:#15803d">⚖ وزن خالص: ۵۰۰۰ کیلوگرم</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۳</div>
            <h3>انتخاب مراحل فرآوری و تأیید</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>روی «مراحل» کلیک کنید و مراحل مورد نظر را انتخاب کنید:</p>
              <ul>
                <li>مراحل <strong>اجباری</strong> از قبل انتخاب شده‌اند</li>
                <li>قیمت به‌صورت خودکار محاسبه می‌شود</li>
                <li>مشتری شرایط را تأیید می‌کند → وضعیت: <span class="status-badge confirmed">تأیید شده</span></li>
              </ul>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div v-for="step in processingStepsMock" :key="step.name" class="mockup-check-row">
                    <span class="mockup-check" :class="{ checked: step.checked, required: step.required }">
                      {{ step.checked ? '✓' : '○' }}
                    </span>
                    <span style="font-size:10px">{{ step.name }}</span>
                    <span v-if="step.required" class="req-badge">اجباری</span>
                  </div>
                  <div class="info-hint" style="background:#fefce8; border-color:#fde047; color:#854d0e; margin-top:8px">
                    💰 قیمت کل: ۴۹,۵۰۰,۰۰۰ ریال
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۴</div>
            <h3>اجرای مراحل فرآوری</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <p>در صفحه «فرآوری» هر مرحله را اجرا کنید:</p>
              <div class="state-machine">
                <div v-for="(state, i) in stateMachine" :key="i" class="sm-item">
                  <div class="sm-circle" :style="`background: ${state.color}`">{{ state.icon }}</div>
                  <div class="sm-label">{{ state.label }}</div>
                  <div v-if="i < stateMachine.length - 1" class="sm-arrow">→</div>
                </div>
              </div>
              <ul style="margin-top: 12px">
                <li><strong>شروع:</strong> مرحله وارد حالت «در حال اجرا» می‌شود</li>
                <li><strong>توقف/ادامه:</strong> برای استراحت یا تعویض اپراتور</li>
                <li><strong>تکمیل:</strong> اندازه‌گیری‌های کیفی ثبت می‌شود</li>
                <li><strong>بازکاری:</strong> مرحله دوباره از ابتدا اجرا می‌شود</li>
              </ul>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div v-for="ex in executionsMock" :key="ex.name" class="execution-row">
                    <div>
                      <div style="font-size:10px; font-weight:600">{{ ex.name }}</div>
                      <div style="font-size:8px; color:#6b7280">تلاش {{ ex.attempt }}</div>
                    </div>
                    <span class="status-badge" :class="ex.state">{{ ex.stateLabel }}</span>
                    <div v-if="ex.state === 'in_progress'" class="mockup-btn-green" style="font-size:8px; padding: 2px 8px">تکمیل</div>
                    <div v-else-if="ex.state === 'pending'" class="mockup-btn-outline" style="font-size:8px; padding: 2px 8px">شروع</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── PAYMENTS ─── -->
      <section id="payment" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">💵</span> راهنمای پرداخت و فاکتور</h2>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۱</div>
            <h3>ثبت پرداخت</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <ol>
                <li>به «پرداخت‌ها» بروید و «پرداخت جدید» بزنید</li>
                <li>سفارش را انتخاب کنید</li>
                <li>مبلغ را وارد کنید (از قیمت‌نامه سفارش)</li>
                <li>پس از پرداخت، دکمه «تأیید» را بزنید</li>
              </ol>
              <div class="info-box" style="margin-top: 12px">
                <div class="info-box-icon">🔒</div>
                <div>تراکنش‌ها پس از ثبت <strong>قابل تغییر نیستند</strong> — برای انطباق حسابداری.</div>
              </div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-table-header">
                    <span>شماره سفارش</span><span>مبلغ</span><span>وضعیت</span>
                  </div>
                  <div class="mockup-table-row">
                    <span style="font-size:9px">STN-2026-000042</span>
                    <span style="font-size:9px">۴۹,۵۰۰,۰۰۰</span>
                    <span class="status-badge confirmed" style="font-size:8px">موفق</span>
                  </div>
                  <div class="mockup-table-row">
                    <span style="font-size:9px">STN-2026-000041</span>
                    <span style="font-size:9px">۲۸,۰۰۰,۰۰۰</span>
                    <span class="status-badge pending" style="font-size:8px">در انتظار</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-header">
            <div class="guide-step-num">۲</div>
            <h3>صدور فاکتور و همگام‌سازی با Odoo</h3>
          </div>
          <div class="guide-step-body">
            <div class="guide-text">
              <ol>
                <li>به «فاکتورها» بروید و «فاکتور جدید» بزنید</li>
                <li>سفارش تأییدشده را انتخاب کنید</li>
                <li>فاکتور صادر می‌شود</li>
                <li>دکمه «همگام‌سازی با Odoo» را بزنید تا فاکتور به سیستم حسابداری ارسال شود</li>
              </ol>
              <div class="tip-box">📊 بعد از همگام‌سازی، شناسه فاکتور در Odoo در ستون «شناسه Odoo» نمایش داده می‌شود.</div>
            </div>
            <div class="guide-mockup">
              <div class="mockup-window">
                <div class="mockup-titlebar"><span></span><span></span><span></span></div>
                <div class="mockup-body" style="padding: 12px">
                  <div class="mockup-table-header">
                    <span>شماره فاکتور</span><span>Odoo ID</span><span>وضعیت همگام</span>
                  </div>
                  <div class="mockup-table-row">
                    <span style="font-size:9px">INV-2026-042</span>
                    <span style="font-size:9px">1284</span>
                    <span class="status-badge confirmed" style="font-size:8px">همگام شد</span>
                  </div>
                  <div class="mockup-table-row">
                    <span style="font-size:9px">INV-2026-043</span>
                    <span style="font-size:9px">—</span>
                    <span class="status-badge pending" style="font-size:8px">در انتظار</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── FAQ ─── -->
      <section id="faq" class="manual-section">
        <h2 class="section-title"><span class="stitle-icon">❓</span> سوالات متداول</h2>
        <div class="faq-list">
          <div class="faq-item" v-for="q in faqList" :key="q.q">
            <div class="faq-q" @click="q.open = !q.open">
              <span>{{ q.q }}</span>
              <span class="faq-toggle">{{ q.open ? '−' : '+' }}</span>
            </div>
            <div class="faq-a" v-if="q.open">{{ q.a }}</div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <div class="manual-footer">
        <div class="mf-logo">🌰 ستانا</div>
        <div class="mf-text">سامانه مدیریت فرآوری پسته | نسخه ۱.۰</div>
        <button class="tour-cta-btn" @click="openTour">🎓 آموزش تعاملی</button>
      </div>

    </main>
  </div>

  <!-- Tour trigger -->
  <OnboardingTour ref="tourRef" />
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useThemeStore } from '../store/theme'
import OnboardingTour from '../components/OnboardingTour.vue'

const theme = useThemeStore()
const dir = computed(() => theme.dir || 'rtl')
const contentEl = ref(null)
const activeSec = ref('intro')
const sidebarOpen = ref(false)
const tourRef = ref(null)

function openTour() {
  localStorage.removeItem('cetana.tour.done')
  tourRef.value?.open()
}

const sections = [
  { id: 'intro',    icon: '🏠', title: 'مقدمه' },
  { id: 'roles',    icon: '👥', title: 'نقش‌های کاربری' },
  { id: 'flow',     icon: '🗺️', title: 'فرایند کلی' },
  { id: 'customer', icon: '🧑‍💼', title: 'راهنمای مشتری' },
  { id: 'admin',    icon: '🔑', title: 'راهنمای مدیر' },
  { id: 'operator', icon: '👷', title: 'راهنمای اپراتور' },
  { id: 'payment',  icon: '💵', title: 'پرداخت و فاکتور' },
  { id: 'faq',      icon: '❓', title: 'سوالات متداول' },
]

const roles = [
  { slug: 'admin',    icon: '🔑', name: 'مدیر سیستم',     color: '#dc2626', perms: ['دسترسی کامل', 'مدیریت کاربران', 'تنظیمات سیستم', 'تأیید رزروها'] },
  { slug: 'fm',       icon: '🏭', name: 'مدیر تأسیسات',   color: '#d9a441', perms: ['مدیریت اسلات‌ها', 'تأیید رزروها', 'مدیریت گردش‌کار'] },
  { slug: 'operator', icon: '👷', name: 'اپراتور',         color: '#2563eb', perms: ['توزین', 'اجرای مراحل', 'ثبت گزارش'] },
  { slug: 'customer', icon: '🧑‍💼', name: 'مشتری',           color: '#15803d', perms: ['ثبت رزرو', 'پیگیری سفارش', 'پرداخت'] },
  { slug: 'acc',      icon: '💰', name: 'حسابدار',         color: '#7c3aed', perms: ['مدیریت فاکتور', 'همگام‌سازی Odoo', 'گزارش مالی'] },
  { slug: 'qc',       icon: '🔬', name: 'کنترل کیفیت',    color: '#0891b2', perms: ['ثبت اندازه‌گیری', 'تأیید مراحل', 'گزارش کیفی'] },
]

const flowSteps = [
  { icon: '📅', title: 'رزرو اسلات',       actor: 'مشتری',       color: '#15803d', desc: 'مشتری یک اسلات زمانی انتخاب و رزرو می‌کند' },
  { icon: '✅', title: 'تأیید رزرو',        actor: 'مدیر',        color: '#d9a441', desc: 'مدیر رزرو را تأیید می‌کند، پیامک به مشتری' },
  { icon: '🚛', title: 'مراجعه مشتری',     actor: 'اپراتور',     color: '#2563eb', desc: 'مشتری می‌رسد، سفارش فرآوری ایجاد می‌شود' },
  { icon: '⚖️', title: 'توزین',            actor: 'اپراتور',     color: '#7c3aed', desc: 'وزن ناخالص، تاره و خالص ثبت می‌شود' },
  { icon: '🔧', title: 'انتخاب مراحل',     actor: 'اپراتور',     color: '#0891b2', desc: 'مراحل فرآوری و قیمت نهایی مشخص می‌شود' },
  { icon: '🏭', title: 'فرآوری',           actor: 'اپراتور',     color: '#15803d', desc: 'هر مرحله اجرا و ثبت می‌شود' },
  { icon: '💵', title: 'پرداخت',           actor: 'مشتری/حسابدار', color: '#d9a441', desc: 'هزینه پرداخت و تأیید می‌شود' },
  { icon: '🧾', title: 'فاکتور و تحویل',  actor: 'حسابدار',     color: '#2563eb', desc: 'فاکتور صادر و با Odoo همگام‌سازی می‌شود' },
]

const reservationStatuses = [
  { key: 'pending',   label: 'در انتظار',   desc: 'رزرو ثبت شده، منتظر بررسی مدیر' },
  { key: 'confirmed', label: 'تأیید شد',    desc: 'مدیر تأیید کرد، پیامک ارسال شد' },
  { key: 'arrived',   label: 'رسیده',       desc: 'مشتری مراجعه کرده است' },
  { key: 'weighed',   label: 'وزن شد',      desc: 'توزین انجام شده' },
  { key: 'rejected',  label: 'رد شد',       desc: 'مدیر رد کرد، اسلات آزاد شد' },
  { key: 'cancelled', label: 'لغو شد',      desc: 'رزرو لغو شده است' },
]

const processingStepsMock = [
  { name: 'دسته‌بندی (Sorting)', checked: true,  required: true },
  { name: 'شستشو (Washing)',     checked: true,  required: false },
  { name: 'خشک‌کردن (Drying)',  checked: true,  required: false },
  { name: 'بوداده (Roasting)',   checked: false, required: false },
]

const stateMachine = [
  { icon: '○', label: 'در انتظار',    color: '#9ca3af' },
  { icon: '▶', label: 'در حال اجرا', color: '#2563eb' },
  { icon: '⏸', label: 'متوقف',       color: '#d9a441' },
  { icon: '✓', label: 'تکمیل',       color: '#15803d' },
]

const executionsMock = [
  { name: 'دسته‌بندی', attempt: 1, state: 'confirmed', stateLabel: 'تکمیل' },
  { name: 'شستشو',     attempt: 1, state: 'in_progress', stateLabel: 'در حال اجرا' },
  { name: 'خشک‌کردن', attempt: 1, state: 'pending', stateLabel: 'در انتظار' },
]

const faqList = reactive([
  { q: 'اگر رمز عبور فراموش کردم چه کار کنم؟', a: 'با مدیر سیستم تماس بگیرید. مدیر می‌تواند از بخش «کاربران» رمز عبور جدید برای شما تنظیم کند.', open: false },
  { q: 'آیا می‌توانم رزرو خود را تغییر دهم؟', a: 'رزروی که هنوز تأیید نشده را می‌توانید لغو کنید و مجدد رزرو کنید. رزروی که توزین شده قابل لغو نیست.', open: false },
  { q: 'قیمت فرآوری چگونه محاسبه می‌شود؟', a: 'قیمت بر اساس وزن خالص و مراحل انتخابی به‌صورت خودکار توسط موتور قیمت‌گذاری محاسبه می‌شود. می‌توانید قبل از تأیید، قیمت‌نامه را مشاهده کنید.', open: false },
  { q: 'فاکتور کِی صادر می‌شود؟', a: 'فاکتور بعد از تأیید سفارش قابل صدور است. حسابدار می‌تواند از بخش «فاکتورها» آن را صادر و با Odoo همگام کند.', open: false },
  { q: 'آیا می‌توانم خط فرآوری را از دوربین ببینم؟', a: 'بله! در بخش «پایش زنده»، دوربین‌های مرتبط با سفارش‌های شما نمایش داده می‌شوند. یک توکن کوتاه‌مدت برای دسترسی امن درخواست کنید.', open: false },
  { q: 'بازکاری (Rework) یعنی چه؟', a: 'اگر یک مرحله فرآوری نادرست انجام شده باشد، اپراتور می‌تواند آن را به «بازکاری» علامت بزند. سیستم یک اجرای جدید می‌سازد و تاریخچه کامل ذخیره می‌شود.', open: false },
])

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeSec.value = id
  sidebarOpen.value = false
}

function onScroll() {
  for (const sec of sections) {
    const el = document.getElementById(sec.id)
    if (el && el.getBoundingClientRect().top < 200) {
      activeSec.value = sec.id
    }
  }
}
</script>

<style scoped>
.manual-layout {
  display: flex;
  min-height: calc(100vh - 60px);
  background: var(--cetana-bg);
  position: relative;
}

/* ── Sidebar ── */
.manual-sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--cetana-surface);
  border-inline-end: 1px solid var(--el-border-color-light);
  padding: 24px 0 40px;
  position: sticky;
  top: 0;
  height: calc(100vh - 60px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

@media (max-width: 760px) {
  .manual-sidebar {
    position: fixed;
    inset-block: 60px 0;
    inset-inline-start: -240px;
    z-index: 200;
    transition: inset-inline-start 0.3s ease;
    height: auto;
  }
  .manual-sidebar.open { inset-inline-start: 0; box-shadow: 4px 0 20px rgba(0,0,0,0.18); }
}

.manual-toc-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--el-text-color-secondary);
  padding: 0 20px 12px;
}

.manual-toc-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 20px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  border-inline-start: 3px solid transparent;
  transition: all 0.18s;
  cursor: pointer;
}
.manual-toc-link:hover { background: var(--el-fill-color-light); color: var(--el-color-primary); }
.manual-toc-link.active { border-inline-start-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 600; }
.toc-icon { font-size: 15px; width: 20px; text-align: center; }

.manual-tour-cta {
  margin: 20px 16px 0;
  padding: 10px 14px;
  background: linear-gradient(135deg, #15803d, #0f6630);
  color: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}
.manual-tour-cta:hover { transform: translateY(-1px); }

.sidebar-toggle {
  display: none;
  position: fixed;
  bottom: 20px;
  inset-inline-start: 16px;
  z-index: 300;
  background: #15803d;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(21,128,61,0.4);
}
@media (max-width: 760px) { .sidebar-toggle { display: flex; align-items: center; gap: 6px; } }

/* ── Content ── */
.manual-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 60px;
}

.manual-section {
  padding: 48px 40px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  max-width: 860px;
}
@media (max-width: 600px) { .manual-section { padding: 32px 16px 16px; } }

/* Hero */
.section-hero {
  text-align: center;
  padding: 40px 0 32px;
}
.hero-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #eaf5ee;
  border: 1px solid #b3d8c0;
  border-radius: 12px;
  padding: 8px 18px;
  margin-bottom: 24px;
}
.hero-dot { width: 16px; height: 16px; border-radius: 5px; background: linear-gradient(135deg, #15803d, #d9a441); }
.hero-name { font-size: 17px; font-weight: 800; color: #15803d; }
.section-hero h1 { font-size: 2rem; font-weight: 800; margin: 0 0 10px; color: var(--cetana-ink); }
.hero-sub { color: var(--el-text-color-secondary); font-size: 16px; margin: 0 0 20px; }
.hero-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.htag { background: #f3f4f6; border-radius: 20px; padding: 5px 14px; font-size: 13px; color: #374151; }
:global(html.dark) .htag { background: #2d3748; color: #cbd5e1; }

/* Section title */
.section-title {
  font-size: 1.45rem;
  font-weight: 800;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--cetana-ink);
}
.stitle-icon { font-size: 1.5rem; }
.section-intro { color: var(--el-text-color-secondary); margin: 0 0 24px; font-size: 14px; line-height: 1.8; }

/* Info box */
.info-box {
  display: flex;
  gap: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 16px;
  margin-top: 24px;
  font-size: 14px;
  line-height: 1.8;
  color: #1e3a5f;
}
:global(html.dark) .info-box { background: #1a2d45; border-color: #1e4070; color: #93c5fd; }
.info-box-icon { font-size: 20px; flex-shrink: 0; }

/* Roles grid */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.role-card {
  background: var(--cetana-surface);
  border-radius: 12px;
  padding: 18px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.role-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  font-size: 22px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.role-name { font-weight: 700; font-size: 14px; margin-bottom: 10px; color: var(--cetana-ink); }
.role-perms { list-style: none; padding: 0; margin: 0; }
.role-perms li { font-size: 12px; color: var(--el-text-color-secondary); padding: 2px 0; }
.role-perms li::before { content: '• '; color: #15803d; }

/* Flow diagram */
.flow-diagram {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  max-width: 500px;
}
.flow-step {
  position: relative;
  border: 1.5px solid;
  border-radius: 12px;
  padding: 14px 18px;
  width: 100%;
  background: white;
}
:global(html.dark) .flow-step { background: #1b2733; }
.flow-step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  font-size: 11px; font-weight: 700;
  margin-bottom: 6px;
}
.flow-step-icon { font-size: 22px; margin-bottom: 4px; }
.flow-step-title { font-weight: 700; font-size: 14px; }
.flow-step-actor { font-size: 11px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.flow-step-desc { font-size: 12px; color: var(--el-text-color-regular); }
.flow-arrow {
  font-size: 20px;
  color: #d1d5db;
  padding: 2px 0 2px 24px;
  line-height: 1;
}

/* Guide steps */
.guide-step { margin-bottom: 32px; }
.guide-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.guide-step-num {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #15803d;
  color: white;
  font-size: 14px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.guide-step-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--cetana-ink); }

.guide-step-body {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.guide-text {
  flex: 1;
  min-width: 220px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.guide-text ol, .guide-text ul { padding-inline-start: 20px; margin: 8px 0; }
.guide-text li { margin-bottom: 4px; }
.guide-text code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  direction: ltr;
  display: inline-block;
}
:global(html.dark) .guide-text code { background: #2d3748; }

.guide-mockup {
  flex: 0 0 240px;
}
@media (max-width: 600px) { .guide-mockup { flex: 1 1 100%; } }

/* Mockup window */
.mockup-window {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  border: 1px solid #e5e7eb;
  background: #fff;
}
:global(html.dark) .mockup-window { background: #1e293b; border-color: #334155; }
.mockup-titlebar {
  background: #f1f5f9;
  padding: 8px 12px;
  display: flex;
  gap: 6px;
  align-items: center;
}
:global(html.dark) .mockup-titlebar { background: #0f172a; }
.mockup-titlebar span {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  display: inline-block;
}
.mockup-titlebar span:nth-child(1) { background: #f87171; }
.mockup-titlebar span:nth-child(2) { background: #fbbf24; }
.mockup-titlebar span:nth-child(3) { background: #4ade80; }
.mockup-body { font-size: 11px; color: #374151; }
:global(html.dark) .mockup-body { color: #cbd5e1; }

.mockup-field {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 7px 10px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #9ca3af;
  background: #f9fafb;
}
:global(html.dark) .mockup-field { background: #0f172a; border-color: #334155; color: #64748b; }

.mockup-field-filled {
  border: 1.5px solid #15803d;
  border-radius: 6px;
  padding: 7px 10px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #111827;
  background: #f0fdf4;
}
:global(html.dark) .mockup-field-filled { background: #052e16; color: #bbf7d0; border-color: #15803d; }

.mockup-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; font-weight: 600; }
.mockup-dialog-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 14px; }
:global(html.dark) .mockup-dialog-title { color: #f1f5f9; }

.mockup-btn-green {
  background: #15803d; color: white;
  border-radius: 6px; padding: 6px 14px;
  font-size: 11px; font-weight: 600;
  cursor: pointer; display: inline-block;
}
.mockup-btn-outline {
  border: 1.5px solid #d1d5db; color: #374151;
  border-radius: 6px; padding: 6px 12px;
  font-size: 11px; cursor: pointer; display: inline-block;
}
:global(html.dark) .mockup-btn-outline { border-color: #4b5563; color: #cbd5e1; }
.mockup-btn-warn { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; display: inline-block; }
.mockup-btn-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 6px; padding: 5px 10px; font-size: 11px; cursor: pointer; display: inline-block; }

.mockup-table-header {
  display: flex; gap: 8px;
  padding: 6px 8px;
  background: #f9fafb;
  font-size: 9px; font-weight: 700; color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}
:global(html.dark) .mockup-table-header { background: #0f172a; border-color: #334155; }
.mockup-table-header span { flex: 1; }

.mockup-table-row {
  display: flex; gap: 8px; align-items: center;
  padding: 7px 8px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 10px;
}
:global(html.dark) .mockup-table-row { border-color: #1e293b; }
.mockup-table-row span { flex: 1; }

.mockup-check-row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 4px;
  border-bottom: 1px solid #f3f4f6;
}
:global(html.dark) .mockup-check-row { border-color: #1e293b; }
.mockup-check {
  width: 18px; height: 18px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: #9ca3af; flex-shrink: 0;
}
.mockup-check.checked { background: #15803d; border-color: #15803d; color: white; }
.req-badge { font-size: 8px; background: #fef3c7; color: #92400e; border-radius: 4px; padding: 1px 5px; }

.info-hint {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 10px;
  color: #1e40af;
  margin-top: 6px;
}
:global(html.dark) .info-hint { background: #1e3a5f; border-color: #1e4070; color: #93c5fd; }

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.status-badge.pending   { background: #fef3c7; color: #92400e; }
.status-badge.confirmed { background: #dcfce7; color: #166534; }
.status-badge.arrived   { background: #dbeafe; color: #1e40af; }
.status-badge.weighed   { background: #ede9fe; color: #5b21b6; }
.status-badge.rejected  { background: #fee2e2; color: #991b1b; }
.status-badge.cancelled { background: #f3f4f6; color: #4b5563; }
.status-badge.in_progress { background: #dbeafe; color: #1e40af; }

/* Status table */
.status-table { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
.st-row { display: flex; align-items: center; gap: 12px; }
.st-desc { font-size: 13px; color: var(--el-text-color-secondary); }

/* Tip / Warning boxes */
.tip-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #166534;
  margin-top: 12px;
  line-height: 1.6;
}
:global(html.dark) .tip-box { background: #052e16; border-color: #166534; color: #86efac; }
.warning-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #92400e;
  margin-top: 12px;
  line-height: 1.6;
}
:global(html.dark) .warning-box { background: #451a03; border-color: #92400e; color: #fde68a; }

/* Formula box */
.formula-box {
  background: var(--cetana-surface);
  border: 1.5px solid var(--el-border-color);
  border-radius: 10px;
  padding: 14px 18px;
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.formula-item { font-size: 13px; }
.formula-sep { font-size: 18px; color: #9ca3af; padding: 0 8px; }
.formula-result { font-size: 14px; color: #15803d; font-weight: 700; background: #eaf5ee; border-radius: 6px; padding: 6px 10px; }

/* State machine */
.state-machine {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.sm-item { display: flex; align-items: center; gap: 4px; }
.sm-circle {
  width: 34px; height: 34px;
  border-radius: 50%;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  flex-shrink: 0;
}
.sm-label { font-size: 11px; color: var(--el-text-color-secondary); }
.sm-arrow { font-size: 16px; color: #d1d5db; margin: 0 2px; }

/* Executions mock */
.execution-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px;
  border-bottom: 1px solid #f3f4f6;
}
:global(html.dark) .execution-row { border-color: #1e293b; }
.execution-row > div:first-child { flex: 1; }

/* FAQ */
.faq-list { display: flex; flex-direction: column; gap: 10px; }
.faq-item {
  background: var(--cetana-surface);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  overflow: hidden;
}
.faq-q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: var(--cetana-ink);
  user-select: none;
}
.faq-q:hover { background: var(--el-fill-color-light); }
.faq-toggle { font-size: 20px; font-weight: 300; color: #15803d; width: 24px; text-align: center; }
.faq-a {
  padding: 0 18px 14px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-lighter);
}

/* Footer */
.manual-footer {
  text-align: center;
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
}
.mf-logo { font-size: 24px; font-weight: 800; color: #15803d; margin-bottom: 6px; }
.mf-text { font-size: 13px; margin-bottom: 20px; }
.tour-cta-btn {
  background: #15803d;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(21,128,61,0.35);
  transition: all 0.2s;
}
.tour-cta-btn:hover { background: #0f6630; transform: translateY(-2px); }
</style>
