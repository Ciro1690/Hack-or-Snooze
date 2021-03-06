$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navWelcome = $("#nav-welcome");
  const $userProfile = $("#user-profile")
  const $navUserProfile = $("#nav-user-profile")
  const $favorites = $("#favorited-articles")

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;

    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;

    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
    
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");


    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      $navUserProfile.text(currentUser.username)
      $("#profile-name").text(`Name: ${currentUser.name}`)
      $("#profile-username").text(`Username: ${currentUser.username}`)
      $("#profile-account-date").text(`Account Created: ${currentUser.createdAt.split("T")[0]}`)
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();
    
    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

    $('#nav-submit-favorites').on('click', function (e) {
      hideElements()
      if (currentUser.favorites.length > $favorites.children().length) {
        for (let favorite of currentUser.favorites) {
          $favorites.append(generateStoryHTML(favorite))
        }
      }
      $favorites.show()
    })
  

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    let storyId = currentUser.favorites.map(story => story.storyId)
    if (storyId.includes(story.storyId)) {
      const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="fas fa-star" id="stars"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
      return storyMarkup;
    }

    else {
      const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="far fa-star" id="stars"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
      return storyMarkup;
    }

    // render story markup

    
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $favorites,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $userProfile
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navWelcome.show();
    $userProfile.hide();
    $navUserProfile.show()
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  /* add submit story to navbar */
  $submit = $('#nav-submit-story')

  $submit.on('click', function() {
    hideElements()
    $submitForm.show()
  })

  // add story to all story list and my story list

  $submitForm.on('submit', async function(e) {
    e.preventDefault()

    const author = $('#author').val()
    const title = $('#title').val()
    const url = $('#url').val()
    const username = currentUser.username
    const hostName = getHostName(url)

    const story = await storyList.addStory(currentUser, { 
      title,
      author,
      url,
      username
    })
  
  
    const $li = $(`<li id="${story.storyId}">
        <i class="far fa-star" id="stars"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
        <strong>${story.title}</strong>
      </a>
      <small class="article-author">by ${story.author}</small>
      <small class="article-hostname ${hostName}">(${hostName})</small>
      <small class="article-username">posted by ${story.username}</small>
    </li>`)

    $allStoriesList.prepend($li);
    currentUser.ownStories.push($li);

    $submitForm.trigger("reset");
    $submitForm.hide()
  })

  // when clicking on username, hide stories and show user profile

  $navUserProfile.on('click', function(e) {
    e.preventDefault()
    $allStoriesList.hide()
    $userProfile.show()
  })

  // when clicking on my stories, own stories are shown and other elements are hidden

  $('#nav-submit-my-stories').on('click', function(e) {
    hideElements()
    if (currentUser.ownStories.length > $ownStories.children().length) {

      for (let story of currentUser.ownStories) {
        $ownStories.append(generateStoryHTML(story))
      }
    }
    $ownStories.show()
  })

  // loop through stars and add event listener to each star for favorites

    const stars = document.querySelectorAll('#stars')

    for (let star of stars) {
      star.addEventListener('click', function () {
        let storyId = currentUser.favorites.map(story => story.storyId)
        if (storyId.includes(star.parentElement.id)) {
          StoryList.removeFavorite(currentUser, star.parentElement.id)
          star.classList = 'fas fa-star'
        }
        else {
          star.classList = 'far fa-star'
          StoryList.addFavorite(currentUser, star.parentElement.id)        
      }
    })
  }
})