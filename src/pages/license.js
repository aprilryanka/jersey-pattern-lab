import '../styles/base.css';
import '../styles/landing.css';
import '../styles/license.css';
import { mountNav, LOGO_SVG } from '../lib/nav.js';
import { $, $$ } from '../lib/ui.js';

const WA = '6289634547665';
$('#flogo').innerHTML = LOGO_SVG;
$('#yr').textContent = new Date().getFullYear();
// Pesan WhatsApp sudah berbahasa Inggris; dipasang langsung tanpa diterjemahkan.
$$('.js-wa').forEach(a => { a.href = `https://wa.me/${WA}?text=${encodeURIComponent(a.dataset.msg)}`; });
mountNav('license');
