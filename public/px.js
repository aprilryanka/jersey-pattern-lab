/* Meta Pixel (dataset 1748085718928733). Loaded on landing and studio only. */
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','1748085718928733');
fbq('track','PageView');
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a'):null;
  if(!a)return;
  var h=a.getAttribute('href')||'';
  if(h.indexOf('wa.me')>-1)fbq('track','Contact');
  else if(h==='/studio')fbq('trackCustom','StartDesign');
},true);
