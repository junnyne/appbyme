const firebaseConfig = {
  apiKey: "AIzaSyBi5e3Z_qYNA_-Tq5UDvTvDO64SWskrhVc",
  authDomain: "appbyme-adf77.firebaseapp.com",
  projectId: "appbyme-adf77",
  storageBucket: "appbyme-adf77.firebasestorage.app",
  messagingSenderId: "327773981674",
  appId: "1:327773981674:web:e138695b9bd6b8ef004093",
  measurementId: "G-ZS9B6T3FJ4"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      const now = new Date(); 

      const data = {
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        time: now.toLocaleString() 
      };

      console.log("User:", data);

      document.getElementById("login-popup").style.display = "none";
      //localStorage.setItem("user", JSON.stringify(data));
      sendWelcomeEmail(data);
    })
    .catch(err => {
      console.log(err);
      alert("Lỗi login 😤");
    });
}

function sendWelcomeEmail(user) {
  if (!ownerEmail) {
    console.log("Không có owner → không gửi");
    return;
  }

  const templateParams = {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    time: user.time,
    message: "Có người stalk bạn nè!",
    to_email: ownerEmail   
  };

  emailjs.send("service_s1e0tfh", "template_p4zuu3a", templateParams)
    .then(function(response) {
      console.log("Email sent!", response.status, response.text);
      toast("Email đã gửi tới " + ownerEmail + " ✨");
    }, function(error) {
      console.log("Failed to send email:", error);
      toast("Gửi email thất bại 😢");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("user");
    if (user) {
        document.getElementById("login-popup").classList.remove("show");
    }
});

const urlParams = new URLSearchParams(window.location.search);
let owner = urlParams.get("owner");

const ownerMap = {
  "1": "ltndung26102002@gmail.com",
  "2": "huyentranvudoan@gmail.com",
  "3": "vothituyethanh2002@gmail.com"
};

const ownerEmail = ownerMap[owner];
