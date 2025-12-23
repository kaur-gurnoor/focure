var firebaseConfig = {
  apiKey: "AIzaSyAzaEIWUE4Z_i308YX84lrZzqP3aq3oya8",
  authDomain: "focus-e111f.firebaseapp.com",
  databaseURL: "https://focus-e111f-default-rtdb.firebaseio.com",
  projectId: "focus-e111f",
  storageBucket: "focus-e111f.firebasestorage.app",
  messagingSenderId: "728158651230",
  appId: "1:728158651230:web:31144d782a50dc3715c5cf",
  measurementId: "G-BVB10TNT4T"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

var db = firebase.database();
var auth = firebase.auth();

var currentUser = null;
var currentUserSlot = null; 
var currentRoomId = null;

auth.onAuthStateChanged(function (user) {
  currentUser = user;

  var authSection = document.getElementById("authSection");
  var appSection = document.getElementById("appSection");

  var welcomeText = document.getElementById("welcomeText");
  var welcomeSub = document.getElementById("welcomeSub");
  var totalStreakEl = document.getElementById("totalStreak");
  var totalStreakBadge = document.getElementById("totalStreakBadge");
  var maxStreakEl = document.getElementById("maxStreak");
  var sessionsEl = document.getElementById("sessionsCount");
  var profileInitial = document.getElementById("profileInitial");

  var profileUsername = document.getElementById("profileUsername");
  var profileFirstName = document.getElementById("profileFirstName");
  var profileLastName = document.getElementById("profileLastName");
  var profileGrade = document.getElementById("profileGrade");
  var profileEmail = document.getElementById("profileEmail");

  if (!authSection || !appSection) return;

  if (user) {
    authSection.style.display = "none";
    appSection.style.display = "block";


    db.ref("users/" + user.uid).on("value", function (snapshot) {
      var data = snapshot.val() || {};

      var firstName = data.firstName || (user.email ? user.email.split("@")[0] : "there");
      var lastName = data.lastName || "";
      var fullName = firstName + (lastName ? " " + lastName : "");
      var username = data.username || "";
      var grade = data.grade || "";
      var totalStreak = data.totalStreak || 0;
      var maxStreak = data.maxStreak || 0;
      var sessionsCount = data.sessionsCount || 0;

      if (welcomeText) {
        welcomeText.textContent = "Hello, " + firstName + " 👋";
      }
      if (welcomeSub) {
        welcomeSub.textContent = fullName && user.email
          ? "Signed in as " + fullName + " (" + user.email + ")"
          : "Signed in as " + (user.email || "student");
      }

      if (totalStreakEl) totalStreakEl.textContent = totalStreak;
      if (totalStreakBadge) totalStreakBadge.textContent = totalStreak;
      if (maxStreakEl) maxStreakEl.textContent = maxStreak;
      if (sessionsEl) sessionsEl.textContent = sessionsCount;

      if (profileUsername) profileUsername.value = username;
      if (profileFirstName) profileFirstName.value = data.firstName || "";
      if (profileLastName) profileLastName.value = data.lastName || "";
      if (profileGrade) profileGrade.value = grade;
      if (profileEmail) profileEmail.textContent = user.email || "";

      if (profileInitial) {
        var initialSource = username || firstName || (user.email ? user.email[0] : "F");
        profileInitial.textContent = initialSource.charAt(0).toUpperCase();
      }
    });

  } else {
    // Logged out
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
});

function getCurrentDisplayName(callback) {
  if (!currentUser) {
    callback("You");
    return;
  }

  db.ref("users/" + currentUser.uid).once("value").then(function (snap) {
    var d = snap.val() || {};
    var name =
      d.username ||
      d.firstName ||
      (currentUser.email ? currentUser.email.split("@")[0] : "You");
    callback(name);
  }).catch(function () {
    callback(currentUser.email ? currentUser.email.split("@")[0] : "You");
  });
}

function signUp() {
  var firstName = (document.getElementById("signupFirstName") || {}).value || "";
  var lastName = (document.getElementById("signupLastName") || {}).value || "";
  var username = (document.getElementById("signupUsername") || {}).value || "";
  var grade = (document.getElementById("signupGrade") || {}).value || "";
  var email = (document.getElementById("signupEmail") || {}).value || "";
  var password = (document.getElementById("signupPassword") || {}).value || "";

  if (!email || !password) {
    alert("Please enter an email and password.");
    return;
  }
  if (!username) {
    alert("Please choose a username.");
    return;
  }

  db.ref("usernameLookup/" + username).once("value").then(function (snap) {
    if (snap.exists()) {
      alert("That username is already taken. Please choose another.");
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then(function (userCredential) {
        var user = userCredential.user;

        var userData = {
          firstName: firstName,
          lastName: lastName,
          username: username,
          grade: grade,
          email: user.email,
          totalStreak: 0,
          maxStreak: 0,
          sessionsCount: 0
        };

        var updates = {};
        updates["users/" + user.uid] = userData;
        updates["usernameLookup/" + username] = {
          uid: user.uid,
          email: user.email
        };

        return db.ref().update(updates);
      })
      .then(function () {
        alert("Signed up successfully!");
      })
      .catch(function (error) {
        alert(error.message);
      });
  });
}

function logIn() {
  var identifier = (document.getElementById("loginId") || {}).value || "";
  var password = (document.getElementById("loginPassword") || {}).value || "";

  if (!identifier || !password) {
    alert("Please enter your email/username and password.");
    return;
  }

  if (identifier.indexOf("@") !== -1) {
    auth.signInWithEmailAndPassword(identifier, password)
      .catch(function (error) {
        alert(error.message);
      });
    return;
  }

  db.ref("usernameLookup/" + identifier).once("value").then(function (snap) {
    if (!snap.exists()) {
      alert("No account found with that username.");
      return;
    }
    var info = snap.val();
    var email = info.email;
    if (!email) {
      alert("Could not find the email for this username.");
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .catch(function (error) {
        alert(error.message);
      });
  });
}

function logOut() {
  auth.signOut();
}

function saveProfile() {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }

  var uid = currentUser.uid;

  var usernameEl = document.getElementById("profileUsername");
  var firstNameEl = document.getElementById("profileFirstName");
  var lastNameEl = document.getElementById("profileLastName");
  var gradeEl = document.getElementById("profileGrade");

  var newUsername = usernameEl ? usernameEl.value.trim() : "";
  var newFirst = firstNameEl ? firstNameEl.value.trim() : "";
  var newLast = lastNameEl ? lastNameEl.value.trim() : "";
  var newGrade = gradeEl ? gradeEl.value.trim() : "";

  db.ref("users/" + uid).once("value").then(function (snap) {
    var data = snap.val() || {};
    var oldUsername = data.username || "";

    function finishUpdate() {
      var updates = {
        firstName: newFirst || data.firstName || "",
        lastName: newLast || data.lastName || "",
        grade: newGrade || data.grade || "",
        username: newUsername || data.username || ""
      };
      db.ref("users/" + uid).update(updates).then(function () {
        alert("Profile updated!");
      });
    }

    if (newUsername && newUsername !== oldUsername) {
      db.ref("usernameLookup/" + newUsername).once("value").then(function (lookupSnap) {
        if (lookupSnap.exists() && lookupSnap.val().uid !== uid) {
          alert("That username is already taken. Please pick another.");
          if (usernameEl) usernameEl.value = oldUsername;
          return;
        }

        var updates = {};
        if (oldUsername) {
          updates["usernameLookup/" + oldUsername] = null;
        }
        updates["usernameLookup/" + newUsername] = {
          uid: uid,
          email: currentUser.email
        };
        db.ref().update(updates).then(finishUpdate);
      });
    } else {
      finishUpdate();
    }
  });
}

function changePassword() {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }
  var newPass = prompt("Enter your new password:");
  if (!newPass) return;

  currentUser.updatePassword(newPass)
    .then(function () {
      alert("Password updated successfully.");
    })
    .catch(function (error) {
      alert(error.message || "Could not change password. You may need to log in again.");
    });
}

// Make auth/profile functions available to HTML onclick
window.signUp = signUp;
window.logIn = logIn;
window.logOut = logOut;
window.saveProfile = saveProfile;
window.changePassword = changePassword;

function createSession() {
  if (!currentUser) {
    alert("Please log in first.");
    return;
  }

  var roomId = Math.random().toString(36).substring(2, 8);
  currentRoomId = roomId;
  var roomRef = db.ref("rooms/" + roomId);

  getCurrentDisplayName(function (displayName) {
    var roomData = {
      user1: {
        uid: currentUser.uid,
        name: displayName,
        status: "focused",
        streak: 0
      },
      user2: {
        uid: null,
        name: null,
        status: "waiting",
        streak: 0
      },
      roomStreak: 0,
      createdBy: currentUser.uid
    };

    roomRef.set(roomData).then(function () {
      // Count this as a session joined
      db.ref("users/" + currentUser.uid + "/sessionsCount").transaction(function (cur) {
        return (cur || 0) + 1;
      });

      window.location.href = "room.html?room=" + roomId + "&user=user1";
    });
  });
}
window.createSession = createSession;

function joinSession() {
  var params = new URLSearchParams(window.location.search);
  var roomId = params.get("room");
  var userSlot = params.get("user");

  if (!roomId) {
    alert("No room ID found.");
    return;
  }
  if (!userSlot) userSlot = "user2";

  currentRoomId = roomId;
  currentUserSlot = userSlot;

  var otherUser = userSlot === "user1" ? "user2" : "user1";

  var myStatusSpan = document.getElementById("myStatus");
  var partnerStatusSpan = document.getElementById("partnerStatus");
  var streakSpan = document.getElementById("streak");
  var inviteLinkSpan = document.getElementById("inviteLink");

  if (inviteLinkSpan) {
    var baseUrl = window.location.origin + window.location.pathname;
    var inviteUrl = baseUrl + "?room=" + roomId + "&user=" + otherUser;
    inviteLinkSpan.textContent = inviteUrl;
  }
  if (currentUser) {
    db.ref("users/" + currentUser.uid + "/sessionsCount").transaction(function (cur) {
      return (cur || 0) + 1;
    });
  }

  db.ref("rooms/" + roomId + "/" + otherUser + "/status")
    .on("value", function (snapshot) {
      var val = snapshot.val() || "waiting";
      if (partnerStatusSpan) partnerStatusSpan.textContent = val;
    })
  db.ref("rooms/" + roomId + "/user1/streak")
    .on("value", function (snapshot) {
      var val = snapshot.val() || 0;
      if (streakSpan) streakSpan.textContent = val;
    });

  startFocusDetection(roomId, userSlot);
  startStreakLoop(roomId, userSlot);
}

if (window.location.pathname.endsWith("room.html")) {
  window.addEventListener("load", joinSession);
}


function startFocusDetection(roomId, userSlot) {
  var myStatusRef = db.ref("rooms/" + roomId + "/" + userSlot + "/status");
  var myStatusSpan = document.getElementById("myStatus");

  function setStatus(status) {
    myStatusRef.set(status);
    if (myStatusSpan) myStatusSpan.textContent = status;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      setStatus("distracted");
    } else {
      setStatus("focused");
    }
  });

  var idleTimeout;

  function resetIdle() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(function () {
      setStatus("distracted");
    }, 15000); // 15 seconds of inactivity
  }

  window.onmousemove = resetIdle;
  window.onkeydown = resetIdle;

  resetIdle();
  setStatus("focused");
}


function startStreakLoop(roomId, userSlot) {
  setInterval(function () {
    db.ref("rooms/" + roomId).once("value").then(function (snapshot) {
      var data = snapshot.val();
      if (!data || !data.user1 || !data.user2) return;

      var status1 = data.user1.status;
      var status2 = data.user2.status;

      if (status1 === "focused" && status2 === "focused") {
        var newStreak1 = (data.user1.streak || 0) + 1;
        var newStreak2 = (data.user2.streak || 0) + 1;

        db.ref("rooms/" + roomId + "/user1/streak").set(newStreak1);
        db.ref("rooms/" + roomId + "/user2/streak").set(newStreak2);

        if (currentUser) {
  
          db.ref("users/" + currentUser.uid + "/totalStreak").transaction(function (cur) {
            return (cur || 0) + 1;
          });

          // Figure out this user's streak in this room
          var myStreakHere = (userSlot === "user1") ? newStreak1 : newStreak2;

          // Update maxStreak
          db.ref("users/" + currentUser.uid + "/maxStreak").transaction(function (cur) {
            cur = cur || 0;
            return myStreakHere > cur ? myStreakHere : cur;
          });
        }
      }
    });
  }, 60000);
}


function leaveSession() {
  var params = new URLSearchParams(window.location.search);
  var roomId = params.get("room");
  var userSlot = params.get("user") || "user2";

  if (roomId) {
    db.ref("rooms/" + roomId + "/" + userSlot + "/status").set("left");
  }

  window.location.href = "index.html";
}
window.joinSession = joinSession;
window.leaveSession = leaveSession;
window.createSession = createSession;
