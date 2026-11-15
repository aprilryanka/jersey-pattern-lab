import '../styles/base.css';
import '../styles/landing.css';
import '../styles/license.css';
import { mountNav, LOGO_SVG } from '../lib/nav.js';
import { $, $$ } from '../lib/ui.js';
import { DEMO } from '../lib/demo.js';

const WA = '6289634547665';
$('#flogo').innerHTML = LOGO_SVG;
$('#yr').textContent = new Date().getFullYear();
// Pesan WhatsApp sudah berbahasa Inggris; dipasang langsung tanpa diterjemahkan.
$$('.js-wa').forEach(a => { a.href = `https://wa.me/${WA}?text=${encodeURIComponent(a.dataset.msg)}`; });
// Demo selalu dibuka di situs demo (tanpa harga langganan Indonesia).
$$('.js-demo').forEach(a => { a.href = DEMO ? '/studio' : 'https://jpl-demo.vercel.app/studio'; });
mountNav('license');
