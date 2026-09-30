const firebaseConfig = {
  apiKey: "AIzaSyACVwVXRB_5nTFozs0PV22zd6wSpZuBVqE",
  authDomain: "reakweb.firebaseapp.com",
  databaseURL: "https://reakweb-default-rtdb.firebaseio.com",
  projectId: "reakweb",
  storageBucket: "reakweb.firebasestorage.app",
  messagingSenderId: "228639861953",
  appId: "1:228639861953:web:2941663bb550703b61b840"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

window.visitorIpData = { ip: "Unavailable", country: "Unknown", region: "Unknown" };

async function fetchGlobalIpInfo() {
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (data && data.success) {
      window.visitorIpData.ip = data.ip;
      window.visitorIpData.country = data.country;
      window.visitorIpData.region = data.region;
    }
  } catch (e) {}
}
fetchGlobalIpInfo();

document.addEventListener("DOMContentLoaded", () => {
  const savedName = localStorage.getItem('visitorName');
  if (savedName) {
    const modal = document.getElementById('nameModal');
    if (modal) modal.classList.add('hidden');
    updateGreeting(savedName);
  }

  // Load saved theme preference
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
  }

  loadProfileData();
});

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) themeIcon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function updateGreeting(name) {
  const heading = document.getElementById('welcomeHeading');
  if (heading) {
    heading.innerText = `Welcome, ${name}! 👋`;
  }
}

async function submitVisitorInfo() {
  const inputVal = document.getElementById('visitorNameInput').value.trim();
  if (!inputVal) {
    alert("Please enter your name to continue.");
    return;
  }

  localStorage.setItem('visitorName', inputVal);
  const modal = document.getElementById('nameModal');
  if (modal) modal.classList.add('hidden');
  updateGreeting(inputVal);

  if (window.visitorIpData.ip === "Unavailable") {
    await fetchGlobalIpInfo();
  }

  try {
    await db.collection('visitor_logs').add({
      visitorName: inputVal,
      ip: window.visitorIpData.ip,
      country: window.visitorIpData.country,
      region: window.visitorIpData.region,
      userAgent: navigator.userAgent,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      time: new Date().toLocaleString()
    });
  } catch (err) {}
}

async function submitSecretNote() {
  const noteInput = document.getElementById('secretNoteInput');
  const noteText = noteInput ? noteInput.value.trim() : "";
  const visitorName = localStorage.getItem('visitorName') || "Stranger";

  if (!noteText) {
    alert("Please write a message first!");
    return;
  }

  if (window.visitorIpData.ip === "Unavailable") {
    await fetchGlobalIpInfo();
  }

  try {
    await db.collection('visitor_notes').add({
      sender: visitorName,
      note: noteText,
      ip: window.visitorIpData.ip,
      country: window.visitorIpData.country,
      region: window.visitorIpData.region,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      time: new Date().toLocaleString()
    });
    
    if (noteInput) noteInput.value = '';
    if (typeof showTemporaryIslandAlert === 'function') {
      showTemporaryIslandAlert("Secret note sent to Ahsan! 🤫", "fa-solid fa-envelope-circle-check", "#10b981");
    } else {
      alert("Secret note sent successfully to Ahsan! 🤫");
    }
    sessionStorage.setItem('hasLeftNote', 'true');
  } catch (e) {
    alert("Failed to send note. Please check your connection.");
  }
}

function promptNameChange() {
  const current = localStorage.getItem('visitorName') || "";
  const nameInput = document.getElementById('visitorNameInput');
  const nameModal = document.getElementById('nameModal');
  if (nameInput && nameModal) {
    nameInput.value = current;
    nameModal.classList.remove('hidden');
  } else {
    const newName = prompt("Update your name:", current);
    if (newName && newName.trim() !== "") {
      localStorage.setItem('visitorName', newName.trim());
      updateGreeting(newName.trim());
    }
  }
}

function shareProfile() {
  if (navigator.share) {
    navigator.share({
      title: 'Ahsan Profile Hub',
      text: 'Check out my official profile hub!',
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    if (typeof showTemporaryIslandAlert === 'function') {
      showTemporaryIslandAlert("Profile link copied! 📋", "fa-solid fa-copy", "#3b82f6");
    } else {
      alert("Profile link copied to clipboard!");
    }
  }
}

function loadProfileData() {
  db.collection('clash_voting').doc('event_data').onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      
      const logoEl = document.getElementById('profileLogo');
      if (logoEl && data.logo) logoEl.src = data.logo;

      const bioEl = document.getElementById('profileBio');
      if (bioEl && data.bio) bioEl.innerText = data.bio;

      if (data.views) {
        const viewSpan = document.getElementById('viewCountVal');
        if (viewSpan) viewSpan.innerText = data.views;
      }
    }
  });
}