// Extracted unchanged from Claude Design. Reference only; requires DCLogic.
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { clients: this.seed(), q: '', filter: 'all', panel: null, form: this.blank(), errors: {}, toast: '', section: 'clients', day: this.iso(new Date()), sessions: this.seedS(), sp: null, sf: { clientId: '', date: '', time: '09:00', dur: '60' }, se: {}, hover: '', focus: '' };
  }
  seed() {
    return [
      { id: 1, name: 'Олена Коваленко', contact: '+380 67 214 38 52', price: 700, left: 8, next: 'Пн, 16 лис · 18:00', status: 'active' },
      { id: 2, name: 'Максим Бондаренко', contact: '@max_bondar', price: 650, left: 2, next: 'Вт, 17 лис · 07:30', status: 'active' },
      { id: 3, name: 'Ірина Шевченко', contact: '+380 50 771 09 26', price: 800, left: 1, next: 'Вт, 17 лис · 19:00', status: 'active' },
      { id: 4, name: 'Андрій Мельник', contact: 'andrii.melnyk@mail.ua', price: 600, left: 12, next: 'Ср, 18 лис · 08:00', status: 'active' },
      { id: 5, name: 'Софія Ткачук', contact: '+380 93 480 15 67', price: 750, left: 5, next: 'Чт, 19 лис · 17:30', status: 'active' },
      { id: 6, name: 'Дмитро Кравчук', contact: '@dkravchuk', price: 600, left: 0, next: '', status: 'inactive' }
    ];
  }
  blank() { return { name: '', contact: '', price: '', left: '', status: 'active' }; }
  openNew = () => this.setState({ panel: 'new', form: this.blank(), errors: {} });
  closePanel = () => this.setState({ panel: null, errors: {} });
  save = () => {
    const f = this.state.form, e = {};
    const p = Number(String(f.price).replace(',', '.'));
    if (!f.name.trim()) e.name = 'Вкажіть ім’я клієнта';
    if (String(f.price).trim() === '' || !isFinite(p) || p <= 0) e.price = 'Ціна має бути більшою за 0';
    if (!/^\d+$/.test(String(f.left).trim())) e.left = 'Вкажіть ціле число від 0';
    if (Object.keys(e).length) { this.setState({ errors: e }); return; }
    const rec = { name: f.name.trim(), contact: f.contact.trim(), price: p, left: parseInt(f.left, 10), status: f.status };
    const id = this.state.panel, isNew = id === 'new';
    const clients = isNew ? [{ id: Date.now(), ...rec }, ...this.state.clients]
      : this.state.clients.map((c) => (c.id === id ? { ...c, ...rec } : c));
    this.setState({ clients, panel: null, errors: {}, toast: isNew ? 'Клієнта додано' : 'Зміни збережено' });
    setTimeout(() => this.setState({ toast: '' }), 2400);
  };
  iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  shift = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return this.iso(d); };
  ms = (date, time) => new Date(date + 'T' + time + ':00').getTime();
  fmt = (iso) => { const d = new Date(iso + 'T12:00:00'); return ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()] + ', ' + d.getDate() + ' ' + ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'][d.getMonth()]; };
  seedS() {
    const t = this.iso(new Date()), d = (n) => this.shift(t, n);
    return [
      { id: 101, clientId: 1, date: d(-1), time: '18:00', dur: 60, status: 'planned' },
      { id: 102, clientId: 4, date: t, time: '08:00', dur: 60, status: 'planned' },
      { id: 103, clientId: 3, date: t, time: '12:00', dur: 60, status: 'cancelled' },
      { id: 104, clientId: 1, date: t, time: '18:00', dur: 60, status: 'planned' },
      { id: 105, clientId: 2, date: d(1), time: '07:30', dur: 60, status: 'planned' },
      { id: 106, clientId: 3, date: d(1), time: '19:00', dur: 60, status: 'planned' },
      { id: 107, clientId: 4, date: d(2), time: '08:00', dur: 60, status: 'planned' },
      { id: 108, clientId: 5, date: d(3), time: '17:30', dur: 90, status: 'planned' },
      { id: 109, clientId: 1, date: d(4), time: '18:00', dur: 60, status: 'planned' }
    ];
  }
  sset = (k) => (e) => this.setState({ sf: { ...this.state.sf, [k]: e.target.value } });
  conflictOf = (f, selfId) => {
    const st = this.ms(f.date, f.time), du = parseInt(f.dur, 10);
    if (!f.date || !/^[0-9]{2}:[0-9]{2}$/.test(f.time) || !(du > 0) || isNaN(st)) return null;
    const en = st + du * 60000;
    return this.state.sessions.find((x) => x.id !== selfId && x.status === 'planned' && this.ms(x.date, x.time) < en && st < this.ms(x.date, x.time) + x.dur * 60000) || null;
  };
  openNewS = () => {
    const first = this.state.clients.find((c) => c.status === 'active') || this.state.clients[0];
    this.setState({ sp: 'new', sf: { clientId: first ? String(first.id) : '', date: this.state.day, time: '09:00', dur: '60' }, se: {} });
  };
  saveS = () => {
    const f = this.state.sf, e = {};
    if (!f.clientId) e.client = 'Оберіть клієнта';
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(f.date)) e.date = 'Вкажіть дату';
    if (!/^[0-9]{2}:[0-9]{2}$/.test(f.time)) e.time = 'Вкажіть час початку';
    const du = Number(f.dur);
    if (!Number.isInteger(du) || du < 15 || du > 240) e.dur = 'Тривалість має бути від 15 до 240 хв';
    if (Object.keys(e).length) { this.setState({ se: e }); return; }
    const id = this.state.sp, isNew = id === 'new', rec = { clientId: Number(f.clientId), date: f.date, time: f.time, dur: du };
    const sessions = isNew ? [...this.state.sessions, { id: Date.now(), status: 'planned', ...rec }] : this.state.sessions.map((x) => (x.id === id ? { ...x, ...rec } : x));
    this.setState({ sessions, sp: null, se: {}, day: f.date, toast: isNew ? 'Заняття заплановано' : 'Зміни збережено' });
    setTimeout(() => this.setState({ toast: '' }), 2400);
  };
  setStatus = (status) => {
    const id = this.state.sp;
    this.setState({ sessions: this.state.sessions.map((x) => (x.id === id ? { ...x, status } : x)), sp: null, toast: status === 'cancelled' ? 'Заняття скасовано' : 'Заняття відновлено' });
    setTimeout(() => this.setState({ toast: '' }), 2400);
  };
  renderVals() {
    const C = !!this.props.compact, s = this.state, q = s.q.trim().toLowerCase();
    const pl = (n, w) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? w[0] : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? w[1] : w[2]; };
    const lessons = (n) => n + ' ' + pl(n, ['заняття', 'заняття', 'занять']);
    const F = 'font:700 14px Manrope,system-ui,sans-serif;';
    const set = (k) => (e) => this.setState({ form: { ...this.state.form, [k]: e.target.value } });
    const all = s.clients;
    const nowMs = Date.now(), nm = {};
    s.sessions.forEach((x) => { if (x.status !== 'planned') return; const t = this.ms(x.date, x.time); if (t > nowMs && (!nm[x.clientId] || t < nm[x.clientId].t)) nm[x.clientId] = { t, date: x.date, time: x.time }; });
    const nextOf = (id) => (nm[id] ? this.fmt(nm[id].date) + ' · ' + nm[id].time : '');
    const hs = (key, base) => base + (s.focus === key ? 'outline:3px solid #1F5C43;outline-offset:2px;' : 'outline:none;') + (s.hover === key ? 'background:#FBF9F4;border-color:#8FB3A0;box-shadow:0 4px 14px rgba(35,39,42,.12);' : '');
    const ev = (key) => ({ enter: () => this.setState({ hover: key }), leave: () => this.setState({ hover: '' }), focus: () => this.setState({ focus: key }), blur: () => this.setState({ focus: '' }) });
    const rowBase = 'width:100%;box-sizing:border-box;text-align:left;font:inherit;color:#23272A;background:#fff;border:1px solid #E6E0D4;border-radius:14px;box-shadow:0 1px 2px rgba(35,39,42,.05);cursor:pointer;display:grid;align-items:center;' + (C ? 'grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;padding:16px;' : 'grid-template-columns:minmax(0,1.7fr) 120px 220px 180px;gap:16px;padding:14px 20px;min-height:72px;');
    const pad2 = (n) => String(n).padStart(2, '0');
    const endOf = (x) => { const m = parseInt(x.time.slice(0, 2), 10) * 60 + parseInt(x.time.slice(3), 10) + x.dur; return pad2(Math.floor(m / 60) % 24) + ':' + pad2(m % 60); };
    const nameOf = (id) => { const c = all.find((x) => x.id === id); return c ? c.name : 'Клієнта видалено'; };
    const sBase = 'width:100%;box-sizing:border-box;text-align:left;font:inherit;color:#23272A;background:#fff;border:1px solid #E6E0D4;border-radius:14px;box-shadow:0 1px 2px rgba(35,39,42,.05);cursor:pointer;display:flex;align-items:center;min-height:76px;gap:' + (C ? 14 : 20) + 'px;padding:' + (C ? '14px 16px' : '16px 20px') + ';';
    const bdg = (t, bg, col) => ({ badge: t, badgeStyle: 'font-size:12px;font-weight:700;border-radius:999px;padding:4px 10px;white-space:nowrap;background:' + bg + ';color:' + col + ';' });
    const dayList = s.sessions.filter((x) => x.date === s.day).sort((a, b) => a.time.localeCompare(b.time));
    const activeCount = dayList.filter((x) => x.status === 'planned').length;
    const srows = dayList.map((x) => {
      const canc = x.status === 'cancelled', past = !canc && this.ms(x.date, x.time) + x.dur * 60000 < nowMs, key = 's' + x.id;
      return { time: x.time, durText: x.dur + ' хв', name: nameOf(x.clientId), nameStyle: 'font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (canc ? 'text-decoration:line-through;color:#5F645F;' : ''), style: hs(key, sBase + (canc ? 'background:#FAF8F3;' : '')), ...ev(key), ...(canc ? bdg('Скасовано', '#F9E3E1', '#8C1D18') : past ? bdg('Минуло', '#F0ECE2', '#5F645F') : bdg('Заплановано', '#E4EFE8', '#1F5C43')), open: () => this.setState({ sp: x.id, sf: { clientId: String(x.clientId), date: x.date, time: x.time, dur: String(x.dur) }, se: {} }) };
    });
    const dd = new Date(s.day + 'T12:00:00');
    const curS = typeof s.sp === 'number' ? s.sessions.find((x) => x.id === s.sp) : null;
    const g = s.sf, se = s.se;
    const cfl = s.sp !== null ? this.conflictOf(g, curS ? curS.id : null) : null;
    const showCf = !!cfl && !(curS && curS.status === 'cancelled');
    const inp = (bad) => 'width:100%;height:48px;box-sizing:border-box;padding:0 12px;border:1px solid ' + (bad ? '#B3261E' : '#D9D2C3') + ';border-radius:12px;background:#fff;font:500 15px Manrope,system-ui,sans-serif;color:#23272A;';
    const list = all.filter((c) => (s.filter === 'all' || c.status === s.filter) && c.name.toLowerCase().includes(q));
    const rows = list.map((c) => ({ style: hs('c' + c.id, rowBase), ...ev('c' + c.id),
      initials: c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
      name: c.name, contact: c.contact || 'Контакт не вказано',
      price: c.price + ' ₴', left: lessons(c.left),
      warn: c.left <= 2, warnText: c.left === 0 ? 'Немає занять' : 'Залишилось мало',
      next: nextOf(c.id) || 'Не заплановано', nextColor: nextOf(c.id) ? '#23272A' : '#5F645F',
      inactive: c.status === 'inactive',
      open: () => this.setState({ panel: c.id, form: { name: c.name, contact: c.contact, price: String(c.price), left: String(c.left), status: c.status }, errors: {} })
    }));
    const cur = typeof s.panel === 'number' ? all.find((c) => c.id === s.panel) : null;
    const f = s.form, er = s.errors;
    const fields = [
      { id: 'f-name', label: 'Ім’я та прізвище', req: true, value: f.name, onChange: set('name'), error: er.name, ph: 'Наприклад, Олена Коваленко', suffix: '', padR: 14 },
      { id: 'f-contact', label: 'Контакт', req: false, value: f.contact, onChange: set('contact'), error: '', ph: 'Телефон або Telegram', suffix: '', padR: 14 },
      { id: 'f-price', label: 'Ціна заняття', req: true, value: f.price, onChange: set('price'), error: er.price, ph: '700', suffix: '₴', padR: 40 },
      { id: 'f-left', label: 'Оплачено тренувань', req: true, value: f.left, onChange: set('left'), error: er.left, ph: '8', suffix: 'занять', padR: 80 }
    ].map((x) => ({ ...x, hasError: !!x.error, border: x.error ? '#B3261E' : '#D9D2C3' }));
    const seg = (on) => 'flex:1;height:44px;border:0;border-radius:9px;cursor:pointer;padding:0 14px;' + F + (on ? 'background:#1F5C43;color:#fff;' : 'background:transparent;color:#4A4F4B;');
    const nav = [['Клієнти', 'isUsers', 'clients'], ['Розклад', 'isCal', 'schedule'], ['Оплати', 'isPay', 'pay']].map(([label, k, key], i) => {
      const on = s.section === key, off = i > 1;
      return {
        label, off, cur: on ? 'page' : 'false', go: () => this.setState({ section: key, panel: null, sp: null }),
        isUsers: k === 'isUsers', isCal: k === 'isCal', isPay: k === 'isPay',
        sideStyle: 'display:flex;align-items:center;gap:12px;height:44px;padding:0 12px;border:0;border-radius:10px;text-align:left;font:' + (on ? 700 : 600) + ' 15px Manrope,system-ui,sans-serif;' + (on ? 'background:#E4EFE8;color:#1F5C43;cursor:pointer;' : off ? 'background:transparent;color:#5F645F;cursor:default;' : 'background:transparent;color:#4A4F4B;cursor:pointer;'),
        tabStyle: 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;background:transparent;min-height:56px;font:' + (on ? 700 : 600) + ' 12px Manrope,system-ui,sans-serif;color:' + (on ? '#1F5C43' : '#5F645F') + ';'
      };
    });
    const pad = C ? 16 : 40;
    return {
      isC: C, isD: !C, nav,
      rootStyle: 'position:relative;display:flex;flex-direction:' + (C ? 'column' : 'row') + ';width:' + (C ? 390 : 1440) + 'px;height:' + (C ? 844 : 900) + 'px;background:#F6F2EA;font-family:Manrope,system-ui,sans-serif;color:#23272A;overflow:hidden;box-sizing:border-box;',
      headStyle: 'display:flex;flex-wrap:wrap;align-items:center;gap:' + (C ? 14 : 16) + 'px;padding:' + (C ? '20px 16px 12px' : '36px 40px 20px') + ';',
      h1Size: C ? 28 : 34, addH: C ? 52 : 48, addW: C ? '100%' : 'auto',
      ctrlStyle: 'display:flex;flex-direction:' + (C ? 'column' : 'row') + ';gap:12px;padding:0 ' + pad + 'px ' + (C ? 12 : 20) + 'px;',
      listStyle: 'flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:' + (C ? 10 : 8) + 'px;padding:0 ' + pad + 'px ' + (C ? 16 : 32) + 'px;',
      showHead: !C && list.length > 0,
      headRowStyle: 'display:grid;grid-template-columns:minmax(0,1.7fr) 120px 220px 180px;gap:16px;padding:0 21px;font-size:12px;font-weight:700;color:#5F645F;text-transform:uppercase;letter-spacing:.04em;',
      rowStyle: 'width:100%;box-sizing:border-box;text-align:left;font:inherit;color:#23272A;background:#fff;border:1px solid #E6E0D4;border-radius:14px;box-shadow:0 1px 2px rgba(35,39,42,.05);cursor:pointer;display:grid;align-items:center;' + (C ? 'grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 16px;padding:16px;' : 'grid-template-columns:minmax(0,1.7fr) 120px 220px 180px;gap:16px;padding:14px 20px;min-height:72px;'),
      nameCol: C ? '1 / -1' : 'auto', remCol: C ? '1 / -1' : 'auto', remOrder: C ? 4 : 3, nextOrder: C ? 3 : 4,
      labelStyle: (C ? 'display:block;' : 'display:none;') + 'font-size:12px;font-weight:600;color:#5F645F;margin-bottom:3px;',
      rows, noResults: all.length > 0 && list.length === 0, emptyAll: all.length === 0, hasRows: list.length > 0,
      totalText: all.length + ' ' + pl(all.length, ['клієнт', 'клієнти', 'клієнтів']),
      shownText: 'Показано ' + list.length + ' з ' + all.length,
      q: s.q, onQ: (e) => this.setState({ q: e.target.value }),
      filters: [['all', 'Усі'], ['active', 'Активні'], ['inactive', 'Неактивні']].map(([k, label]) => ({ label, on: s.filter === k, style: seg(s.filter === k), pick: () => this.setState({ filter: k }) })),
      resetSearch: () => this.setState({ q: '', filter: 'all' }),
      clearAll: () => this.setState({ clients: [], sessions: [], q: '', filter: 'all' }),
      restore: () => this.setState({ clients: this.seed(), sessions: this.seedS() }),
      panelOpen: s.panel !== null, isEdit: !!cur,
      panelTitle: cur ? cur.name : 'Новий клієнт',
      sumLeft: cur ? lessons(cur.left) : '', sumNext: cur ? (nextOf(cur.id) || 'Не заплановано') : '',
      panelStyle: 'background:#fff;display:flex;flex-direction:column;box-sizing:border-box;box-shadow:0 0 40px rgba(35,39,42,.2);position:absolute;' + (C ? 'left:0;right:0;bottom:0;top:48px;border-radius:20px 20px 0 0;' : 'top:0;right:0;bottom:0;width:440px;'),
      fields,
      statusBtns: [['active', 'Активний'], ['inactive', 'Неактивний']].map(([k, label]) => ({ label, on: f.status === k, style: seg(f.status === k), pick: () => this.setState({ form: { ...this.state.form, status: k } }) })),
      closePanel: this.closePanel, openNew: this.openNew, save: this.save,
      isClients: s.section === 'clients', isSchedule: s.section === 'schedule',
      srows, noSessions: srows.length === 0,
      dayTitle: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'][dd.getDay()],
      daySub: dd.getDate() + ' ' + ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'][dd.getMonth()] + ' ' + dd.getFullYear() + (s.day === this.iso(new Date()) ? ' · сьогодні' : ''),
      dayCountText: activeCount + ' ' + pl(activeCount, ['заняття', 'заняття', 'занять']),
      dayBarStyle: 'display:flex;align-items:center;gap:8px;padding:0 ' + pad + 'px ' + (C ? 12 : 20) + 'px;',
      dateFlex: C ? '1 1 0' : '0 1 300px',
      arrowStyle: 'width:48px;height:48px;flex:none;border:1px solid #D9D2C3;background:#fff;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;',
      todayStyle: 'height:48px;flex:none;padding:0 18px;border:1px solid #1F5C43;color:#1F5C43;background:#fff;border-radius:12px;cursor:pointer;font:700 14px Manrope,system-ui,sans-serif;',
      prevDay: () => this.setState({ day: this.shift(s.day, -1) }), nextDay: () => this.setState({ day: this.shift(s.day, 1) }), goToday: () => this.setState({ day: this.iso(new Date()) }),
      openNewS: this.openNewS, closeS: () => this.setState({ sp: null, se: {} }), saveS: this.saveS,
      sPanelOpen: s.sp !== null, isActiveS: !!curS && curS.status === 'planned', isCancelledS: !!curS && curS.status === 'cancelled',
      sTitle: curS ? 'Редагувати заняття' : 'Записати на тренування',
      sClient: g.clientId, sDate: g.date, sTime: g.time, sDur: g.dur,
      onSClient: this.sset('clientId'), onSDate: this.sset('date'), onSTime: this.sset('time'), onSDur: this.sset('dur'),
      stClient: inp(!!se.client), stDate: inp(!!se.date), stTime: inp(!!se.time), stDur: inp(!!se.dur),
      clientOpts: all.filter((c) => c.status === 'active' || String(c.id) === g.clientId).map((c) => ({ id: String(c.id), name: c.name })),
      durOpts: [30, 45, 60, 90, 120].map((m) => ({ v: String(m), t: m + ' хв' })),
      sErrList: Object.values(se).map((m) => ({ msg: m })), hasSErr: Object.keys(se).length > 0,
      showCf, conflictText: cfl ? 'Перетинається із заняттям: ' + nameOf(cfl.clientId) + ', ' + cfl.time + '–' + endOf(cfl) : '',
      saveLabel: showCf ? 'Зберегти все одно' : 'Зберегти', restoreLabel: cfl ? 'Відновити все одно' : 'Відновити заняття',
      cancelS: () => this.setStatus('cancelled'), restoreS: () => this.setStatus('planned'),
      hasToast: !!s.toast, toast: s.toast, toastBottom: C ? 88 : 28
    };
  }
}
