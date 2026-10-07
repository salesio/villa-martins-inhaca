const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const summary = document.querySelector('#booking-summary');
const formError = document.querySelector('#form-error');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');
const languageSelect = document.querySelector('#language-select');
const translations = window.VM_TRANSLATIONS;
const localeMap = { en: 'en', pt: 'pt-PT', fr: 'fr', af: 'af', nl: 'nl', da: 'da', gd: 'gd', zh: 'zh-CN' };
let activeLanguage = localStorage.getItem('villaMartinsLanguage') || 'en';
if (!translations[activeLanguage]) activeLanguage = 'en';

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const arrival = bookingForm.elements.arrival;
const departure = bookingForm.elements.departure;
arrival.min = localToday;
departure.min = localToday;

const formatDate = value => value ? new Intl.DateTimeFormat(localeMap[activeLanguage], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '';

function applyLanguage(code) {
  activeLanguage = translations[code] ? code : 'en';
  const t = translations[activeLanguage];
  document.documentElement.lang = activeLanguage === 'zh' ? 'zh-CN' : activeLanguage;
  languageSelect.value = activeLanguage;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    if (t[element.dataset.i18n]) element.textContent = t[element.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    if (t[element.dataset.i18nHtml]) element.innerHTML = t[element.dataset.i18nHtml];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    if (t[element.dataset.i18nPlaceholder]) element.placeholder = t[element.dataset.i18nPlaceholder];
  });
  const adultOptions = bookingForm.elements.adults.options;
  [...adultOptions].forEach((option, index) => {
    const value = option.value;
    option.textContent = value === '1' ? `1 ${t.adultWord}` : `${value}${index === adultOptions.length - 1 ? '+' : ''} ${t.adultsWord}`;
  });
  [...bookingForm.elements.children.options].forEach(option => {
    const value = option.value;
    option.textContent = value === '0' ? '—' : value === '1' ? `1 ${t.childWord}` : `${value}${value === '4' ? '+' : ''} ${t.childrenWord}`;
  });
  document.title = `Villa Martins · ${t.location}`;
  try { localStorage.setItem('villaMartinsLanguage', activeLanguage); } catch (_) {}
  updateSummary();
}

function nightsBetween() {
  if (!arrival.value || !departure.value) return 0;
  return Math.round((new Date(departure.value) - new Date(arrival.value)) / 86400000);
}

function updateSummary() {
  const t = translations[activeLanguage];
  if (arrival.value) departure.min = arrival.value;
  const nights = nightsBetween();
  formError.classList.remove('is-visible');
  if (!arrival.value || !departure.value) {
    summary.textContent = t.summaryPrompt;
    return;
  }
  if (nights < 1) {
    summary.textContent = t.errorDate;
    return;
  }
  const adults = bookingForm.elements.adults.value;
  const children = bookingForm.elements.children.value;
  summary.innerHTML = `<strong>${nights} ${nights === 1 ? t.night : t.nights}</strong> · ${formatDate(arrival.value)} — ${formatDate(departure.value)} · ${adults} ${adults === '1' ? t.adultWord : t.adultsWord}${children === '0' ? '' : ` · ${children} ${children === '1' ? t.childWord : t.childrenWord}`}`;
}

function requestText() {
  const t = translations[activeLanguage];
  const data = new FormData(bookingForm);
  const extras = data.getAll('extras');
  return [
    'Hello Villa Martins, I would like to request availability:',
    '',
    `${t.name}: ${data.get('name')}`,
    `${t.arrival}: ${formatDate(data.get('arrival'))}`,
    `${t.departure}: ${formatDate(data.get('departure'))}`,
    `${t.adults}: ${data.get('adults')} · ${t.children}: ${data.get('children')}`,
    `Experiences / transfer: ${extras.length ? extras.join(', ') : 'Not selected yet'}`,
    `Notes: ${data.get('message') || 'None'}`,
    '',
    'Please confirm availability and send a quotation. Thank you.'
  ].join('\n');
}

function validRequest() {
  formError.classList.remove('is-visible');
  if (!bookingForm.reportValidity()) return false;
  if (nightsBetween() < 1) {
    formError.textContent = translations[activeLanguage].errorDate;
    formError.classList.add('is-visible');
    departure.focus();
    return false;
  }
  return true;
}

document.querySelectorAll('[data-open-booking]').forEach(button => button.addEventListener('click', () => {
  bookingDialog.showModal();
  document.body.classList.add('is-locked');
}));

document.querySelector('[data-close-booking]').addEventListener('click', () => bookingDialog.close());
bookingDialog.addEventListener('close', () => document.body.classList.remove('is-locked'));
bookingDialog.addEventListener('click', event => {
  if (event.target === bookingDialog) bookingDialog.close();
});

bookingForm.addEventListener('input', updateSummary);
bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!validRequest()) return;
  window.open(`https://wa.me/258856774327?text=${encodeURIComponent(requestText())}`, '_blank', 'noopener');
});

document.querySelector('#send-email').addEventListener('click', () => {
  if (!validRequest()) return;
  const subject = 'Villa Martins availability request';
  window.location.href = `mailto:res@villamartins.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(requestText())}`;
});

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
  lightboxImage.src = button.dataset.lightbox;
  lightbox.showModal();
  document.body.classList.add('is-locked');
}));
lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('close', () => document.body.classList.remove('is-locked'));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelector('#year').textContent = new Date().getFullYear();
languageSelect.addEventListener('change', event => applyLanguage(event.target.value));
applyLanguage(activeLanguage);
