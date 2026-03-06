---
title: "Mis Certificaciones"
---

<div class="certs-grid">
  <!-- Tarjeta eJPT -->
  <a href="https://certs.ine.com/b2627dbc-d749-4a7c-b687-6deff004b49a" target="_blank" class="cert-card">
    <div class="cert-img-container">
      <img src="/images/ejpt.jpg" alt="eJPT">
    </div>
    <div class="cert-info">
      <h3>eJPT</h3>
      <p>eLearnSecurity Junior Penetration Tester</p>
      <span class="cert-status done">VERIFICAR CREDENCIAL 🔗</span>
    </div>
  </a>

  <!-- Tarjeta eCPPT -->
  <a href="https://certs.ine.com/8c84494a-a95e-468d-9502-da63722cb6d1#acc.QeJEc7kY" target="_blank" class="cert-card">
    <div class="cert-img-container">
      <img src="/images/ecppt.jpg" alt="eCPPT">
    </div>
    <div class="cert-info">
      <h3>eCPPT v2</h3>
      <p>Certified Professional Penetration Tester</p>
      <span class="cert-status done">VERIFICAR CREDENCIAL 🔗<</span>
    </div>
  </a>

  <!-- Tarjeta Google -->
  <a href="https://www.credly.com/badges/53a5ce3f-d47b-47fd-909f-0cfd05122d6f/public_url" target="_blank" class="cert-card">
    <div class="cert-img-container">
      <img src="/images/googlecpc.png" alt="Google Cyber">
    </div>
    <div class="cert-info">
      <h3>Google Cyber</h3>
      <p>Professional Certificate</p>
      <span class="cert-status done">VERIFICAR CREDENCIAL 🔗</span>
    </div>
  </a>
</div>


<style>
/* --- Contenedor de la Rejilla --- */
.certs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

/* --- Estilo de la Tarjeta (Ahora es un enlace <a>) --- */
.cert-card {
  background: #111926;
  border: 1px solid #1f2a3a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 460px; 
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none !important; /* Quita subrayado de enlace */
  color: inherit !important;       /* Evita que el texto se ponga azul */
}

/* --- Efecto Hover --- */
.cert-card:hover {
  transform: translateY(-8px);
  border-color: #ff9d00;
  box-shadow: 0 15px 35px rgba(255, 157, 0, 0.15);
}

/* --- Contenedor de la Imagen (Certificado) --- */
.cert-img-container {
  flex: 0 0 280px; /* Altura fija para la parte visual */
  background: #0d141f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.cert-img-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  /* El borde dorado sutil que rodea el certificado */
  border: 2px solid rgba(212, 175, 55, 0.6); 
  border-radius: 4px;
  transition: transform 0.3s ease;
}

.cert-card:hover .cert-img-container img {
  transform: scale(1.03); /* Pequeño zoom al pasar el ratón */
}

/* --- Contenedor de Información --- */
.cert-info {
  flex: 1;
  padding: 25px;
  background: #111926;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.cert-info h3 { 
  margin: 0; 
  font-size: 1.6rem; 
  color: #fff; 
  font-family: 'Segoe UI', sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.cert-info p {
  margin: 8px 0;
  color: #888;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* --- Etiqueta de Estado / Verificación --- */
.cert-status { 
  font-size: 0.75rem; 
  font-weight: bold; 
  margin: 15px auto 0 auto; 
  display: inline-block;
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba(0,0,0,0.4);
  letter-spacing: 1px;
  transition: 0.3s;
  border: 1px solid transparent;
}

/* Colores según el estado */
.cert-status.done { 
  color: #00e676; 
  border-color: rgba(0, 230, 118, 0.3); 
}

.cert-status.progress { 
  color: #ff9100; 
  border-color: rgba(255, 145, 0, 0.3); 
}

/* Cambio de color al hacer hover en la tarjeta */
.cert-card:hover .cert-status.done {
  background: #00e676;
  color: #050a11;
}

/* Responsivo para móviles */
@media (max-width: 800px) {
  .certs-grid {
    grid-template-columns: 1fr;
  }
  .cert-card {
    min-height: auto;
  }
  .cert-img-container {
    flex: 0 0 220px;
  }
}
</style>
