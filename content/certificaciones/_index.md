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
      <span class="cert-status done">VERIFICAR CREDENCIAL 🔗</span>
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

  <!-- Tarjeta CRTSv2 -->
  <a href="https://www.credential.net/bf2e0269-1006-43a2-9469-f2a1bfe367ed#acc.hfZ9wRzE" target="_blank" class="cert-card">
    <div class="cert-img-container">
      <img src="/images/CRTSv2.png" alt="CRTSv2">
    </div>
    <div class="cert-info">
      <h3>Certified Red Team Specialist</h3>
      <p>V2 | CyberWarfare</p>
      <span class="cert-status done">VERIFICAR CREDENCIAL 🔗</span>
    </div>
  </a>

</div>


<style>
/* --- Contenedor de la Rejilla --- */
.certs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

/* --- Estilo de la Tarjeta --- */
.cert-card {
  background: #111926;
  border: 1px solid #1f2a3a;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none !important;
  color: inherit !important;
}

/* --- Efecto Hover --- */
.cert-card:hover {
  transform: translateY(-8px);
  border-color: #ff9d00;
  box-shadow: 0 15px 35px rgba(255, 157, 0, 0.15);
}

/* --- Contenedor de la Imagen --- */
.cert-img-container {
  height: 220px;
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
  border: 2px solid rgba(212, 175, 55, 0.6);
  border-radius: 4px;
  transition: transform 0.3s ease;
}

.cert-card:hover .cert-img-container img {
  transform: scale(1.03);
}

/* --- Información --- */
.cert-info {
  flex: 1;
  padding: 22px;
  background: #111926;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.cert-info h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #fff;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.cert-info p {
  margin: 8px 0;
  color: #888;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* --- Etiqueta de Estado --- */
.cert-status {
  font-size: 0.72rem;
  font-weight: bold;
  margin: 14px auto 0 auto;
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0,0,0,0.4);
  letter-spacing: 1px;
  transition: 0.3s;
  border: 1px solid transparent;
}

.cert-status.done {
  color: #00e676;
  border-color: rgba(0, 230, 118, 0.3);
}

.cert-status.progress {
  color: #ff9100;
  border-color: rgba(255, 145, 0, 0.3);
}

.cert-card:hover .cert-status.done {
  background: #00e676;
  color: #050a11;
}

/* --- Responsivo --- */
@media (max-width: 1000px) {
  .certs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .certs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
