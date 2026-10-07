const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const summary = document.querySelector('#booking-summary');
const formError = document.querySelector('#form-error');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = lightbox.querySelector('img');

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const arrival = bookingForm.elements.arrival;
const departure = bookingForm.elements.departure;
arrival.min = localToday;
departure.min = localToday;

const formatDate = value => value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '';

function nightsBetween() {
  if (!arrival.value || !departure.value) return 0;
  return Math.round((new Date(departure.value) - new Date(arrival.value)) / 86400000);
}

function updateSummary() {
  if (arrival.value) departure.min = arrival.value;
  const nights = nightsBetween();
  formError.classList.remove('is-visible');
  if (!arrival.value || !departure.value) {
    summary.textContent = 'Choose your dates to see your stay summary.';
    return;
  }
  if (nights < 1) {
    summary.textContent = 'Your departure must be after your arrival.';
    return;
  }
  const adults = bookingForm.elements.adults.value;
  const children = bookingForm.elements.children.value;
  summary.innerHTML = `<strong>${nights} night${nights === 1 ? '' : 's'}</strong> · ${formatDate(arrival.value)} to ${formatDate(departure.value)} · ${adults} adult${adults === '1' ? '' : 's'}${children === '0' ? '' : ` · ${children} child${children === '1' ? '' : 'ren'}`}`;
}

function requestText() {
  const data = new FormData(bookingForm);
  const extras = data.getAll('extras');
  return [
    'Hello Villa Martins, I would like to request availability:',
    '',
    `Name: ${data.get('name')}`,
    `Arrival: ${formatDate(data.get('arrival'))}`,
    `Departure: ${formatDate(data.get('departure'))}`,
    `Guests: ${data.get('adults')} adult(s), ${data.get('children')} child(ren) aged 4–12`,
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
    formError.textContent = 'Please choose a departure date after your arrival.';
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
