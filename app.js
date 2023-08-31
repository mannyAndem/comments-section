let comments = JSON.parse(localStorage.getItem("comments")) || null;
let currentUser;
let globalAvailableId;
const commentsContainer = document.querySelector("#comments-container");
const deleteModal = document.querySelector("#delete-modal");
const deleteConfirm = document.querySelector("#delete-confirm");
const deleteCancel = document.querySelector("#delete-cancel");

// general Comment class
class Comment {
  constructor(object) {
    this.content = object.content;
    this.createdAt = object.createdAt;
    this.replies = object.replies;
    this.id = object.id;
    this.score = object.score;
    this.user = object.user;
    this.upvoted = false;
    this.downvoted = false;
  }
  render(container) {
    container.innerHTML += `
        <div class="flex flex-col gap-8 " id="${this.id}">
        <div
          class="bg-white rounded-md p-4 pb-16 lg:pl-16 lg:pb-4 relative flex flex-col gap-4 shadow-md"
        >
          <div class="flex gap-4 items-center">
            <div>
              <img src="${this.user.image.webp}" alt="${this.user.username}" />
            </div>
            <span class="font-bold text-lg text-darkBlue">${this.user.username}</span>
            <span class="text-grayishBlue">${this.createdAt}</span>
          </div>
          <p class="text-grayishBlue font-normal">
            ${this.content}
          </p>
          <div
            class="p-2 rounded-lg items-center flex lg:flex-col absolute lg:top-1/2 transform lg:-translate-y-1/2 mx-4 lg:my-0 bottom-0 my-4 lg:bottom-auto left-0  gap-4 bg-veryLightGray text-moderateBlue font-bold text-xl"
          >
            <img src="./images/icon-plus.svg" class="upvote cursor-pointer py-2">
            <span>${this.score}</span>
            <img src="./images/icon-minus.svg" class="downvote cursor-pointer py-2">
          </div>
          <div
            class="flex gap-2 cursor-pointer items-center absolute m-6 bottom-0 right-0 lg:m-4 lg:bottom-auto lg:top-4 lg:right-4 text-moderateBlue font-bold transition-all duration-300 ease-in-out hover:opacity-30" 
          >
            <img src="images/icon-reply.svg" alt="" class="reply"/>
            <span class="reply">Reply</span>
          </div>
        </div>
        <!-- nested replies -->
        <div
          class="pl-4 lg:ml-8 lg:pl-8 flex flex-col mb-8 gap-4 border-l-2 border-lightGray" id="comment-${this.id}-replies"
        ></div>
      </div>`;
  }
  upvote() {
    this.score += 1;
    this.upvoted = true;
    this.downvoted = false;
    updateComments();
  }
  downvote() {
    this.score -= 1;
    this.downvoted = true;
    this.upvoted = false;
    updateComments();
  }
  reply(object) {
    console.log("replied");
    object.replyingTo = this.user.username;
    if (this.replies) {
      this.replies.push(object);
      let container = document.querySelector(`#comment-${this.id}-replies`);
      object.render(container);
    } else {
      let targetComment = comments.find(
        (comment) => comment.replies.indexOf(this) != -1
      );
      targetComment.replies.push(object);
      let container = document.querySelector(
        `#comment-${targetComment.id}-replies`
      );
      object.render(container);
    }
    updateComments();
  }
}

// class for comments created by the current user to enable edit and delete features
class CurrentUserComment extends Comment {
  render(container) {
    container.innerHTML += `
    <div class="flex flex-col gap-8" id="${this.id}">
        <div
        class="bg-white rounded-md p-4 pb-16 lg:pl-16 lg:pb-4 relative flex flex-col gap-4 shadow-md"
        >
          <div class="flex gap-3 items-center">
            <div>
              <img src="${this.user.image.webp}" alt="${this.user.username}" />
            </div>
            <span class="font-bold text-lg text-darkBlue">${
              this.user.username
            }</span>
            <span
              class="flex items-center justify-center py-1 px-2 bg-moderateBlue text-white font-[500] rounded-md"
              >you</span
            >
            <span class="text-grayishBlue">${getTimeElapsed(
              this.createdAt,
              Date.now()
            )}</span>
          </div>
          <p class="text-grayishBlue font-normal">
            <span class="font-bold text-moderateBlue cursor-pointer">${(() => {
              if (this.replyingTo) {
                return "@" + this.replyingTo;
              } else {
                return "";
              }
            })()} </span>${this.content}
          </p>
          <div
          class="p-2 rounded-lg items-center flex lg:flex-col absolute lg:top-1/2 transform lg:-translate-y-1/2 mx-4 lg:my-0 bottom-0 my-4 lg:bottom-auto left-0  gap-4 bg-veryLightGray text-moderateBlue font-bold text-xl"
        >
          <img src="./images/icon-plus.svg" class="upvote cursor-pointer py-2">
          <span>${this.score}</span>
          <img src="./images/icon-minus.svg" class="downvote cursor-pointer py-2">
        </div>
          <div class="flex gap-3 items-center absolute m-6 lg:m-4 bottom-0 lg:top-4 right-4 lg:bottom-auto">
            <div class="flex items-center gap-2 cursor-pointer transition-all duration-300 ease-in-out hover:opacity-30">
              <img src="./images/icon-delete.svg" class="delete"alt="" />
              <span class="text-softRed font-[600] delete">Delete</span>
            </div>
            <div class="flex items-center gap-2 cursor-pointer transition-all duration-300 ease-in-out hover:opacity-30">
              <img src="./images/icon-edit.svg" class="delete" alt="" />
              <span class="text-moderateBlue font-[600] edit">Edit</span>
            </div>
          </div>
        </div>

        <div
          class="ml-8 pl-8 flex flex-col gap-4 border-l-2 border-lightGray"
        ></div>
      </div>
      `;
  }
  delete() {
    // if comment is a main comment and not a reply, delete from the comments array
    if (comments.indexOf(this) != -1) {
      comments.splice(comments.indexOf(this), 1);
      // rerendering the comments
      commentsContainer.innerHTML = "";
      comments.forEach((comment) => comment.render(commentsContainer));
    } else {
      // if comment is a reply to another comment, look for the specific replies array the comment is contained in and delete from there
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].replies.indexOf(this) != -1) {
          comments[i].replies.splice(comments[i].replies.indexOf(this), 1);
          // rerendering the replies for the specific comment
          document.querySelector(
            `#comment-${comments[i].id}-replies`
          ).innerHTML = "";
          comments[i].replies.forEach((reply) =>
            reply.render(
              document.querySelector(`#comment-${comments[i].id}-replies`)
            )
          );
          break;
        }
      }
    }
    updateComments();
  }
  edit(string) {
    this.content = string;
    commentsContainer.innerHTML = "";
    comments.forEach((comment) => {
      comment.render(commentsContainer);
      comment.replies.forEach((reply) =>
        reply.render(document.querySelector(`#comment-${comment.id}-replies`))
      );
    });
    updateComments();
  }
}

// function to fetch and render comments from the json file
async function fetchComments() {
  let data = await fetch("./data.json");
  data = await data.json();
  currentUser = { ...data.currentUser };
  console.log(currentUser);
  comments = [...data.comments];
  //   mapping the comments to each be an instance of the Comment class or in the case of a comment by the current user, the CurrentUserComment class
  comments = comments.map((comment) => {
    console.log(comment.user.username);
    if (comment.user.username == currentUser.username) {
      return new CurrentUserComment(comment);
    } else {
      return new Comment(comment);
    }
  });
  comments.forEach((comment) => {
    // rendering each comment
    comment.render(commentsContainer);
    if (comment.replies.length != 0) {
      // mapping each reply to a comment to also be an instance of the Comment class or in the case of a reply by the current user, the currentUserCommentClass
      comment.replies = comment.replies.map((reply) => {
        if (reply.user.username == currentUser.username) {
          return new CurrentUserComment(reply);
        } else {
          return new Comment(reply);
        }
      });
      //   rendering the replies for each comment inside the replies container of each comment
      comment.replies.forEach((reply) =>
        reply.render(document.querySelector(`#comment-${comment.id}-replies`))
      );
    }
    updateComments();
  });
  // getting the next id to be used for a new comment
  globalAvailableId = getAvailableId();
}

// if there are no comments in local storage, fetch the comments from the json file, else just get the current user data from the json file and then render the comments from local storage
if (comments == null) {
  fetchComments();
} else {
  (async () => {
    let data = await fetch("./data.json");
    data = await data.json();
    currentUser = { ...data.currentUser };

    comments = comments.map((comment) => {
      console.log(comment.user.username);
      if (comment.user.username == currentUser.username) {
        return new CurrentUserComment(comment);
      } else {
        return new Comment(comment);
      }
    });
    comments.forEach((comment) => {
      console.log(comment);
      // rendering each comment
      comment.render(commentsContainer);
      if (comment.replies.length != 0) {
        // mapping each reply to a comment to also be an instance of the Comment class or in the case of a reply by the current user, the currentUserCommentClass
        comment.replies = comment.replies.map((reply) => {
          if (reply.user.username == currentUser.username) {
            return new CurrentUserComment(reply);
          } else {
            return new Comment(reply);
          }
        });
        //   rendering the replies for each comment inside the replies container of each comment
        comment.replies.forEach((reply) =>
          reply.render(document.querySelector(`#comment-${comment.id}-replies`))
        );
      }
    });
    globalAvailableId = getAvailableId();
  })();
  // Adding the prototypes to the comments
}
// EVENT LISTENERS

//event listeners for the dynamically generated elements. One event listener is attached to the window then conditionals are used to attach handlers for individual events
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("upvote")) {
    let targetComment = getTargetComment(
      e.target.parentElement.parentElement.parentElement.id
    );
    if (!targetComment.upvoted) {
      targetComment.upvote();
      e.target.nextElementSibling.innerHTML = targetComment.score;
    }
  }

  // event listener for downvote buttons
  if (e.target.classList.contains("downvote")) {
    let targetComment = getTargetComment(
      e.target.parentElement.parentElement.parentElement.id
    );
    if (targetComment.score != 0 && !targetComment.downvoted) {
      targetComment.downvote();
      e.target.previousElementSibling.innerHTML = targetComment.score;
    }
  }

  // event listener for the edit button
  if (e.target.classList.contains("edit")) {
    let targetComment = getTargetComment(
      e.target.parentElement.parentElement.parentElement.parentElement.id
    );
    commentInput.focus();
    commentInput.value = targetComment.content;
    // changing the state of the comment to an edit so the next submission of the comment form will edit the current comment
    isEdit.boolean = true;
    isEdit.targetComment = targetComment;
  }

  // event listener for the reply buttons
  if (e.target.classList.contains("reply")) {
    let targetComment = getTargetComment(
      e.target.parentElement.parentElement.parentElement.id
    );
    commentInput.focus();
    // changing the state of the comment to a reply so the next submission of the comment form will reply to the current comment
    isReply.boolean = true;
    isReply.targetComment = targetComment;
  }

  // event listeners for the delete button
  if (e.target.classList.contains("delete")) {
    let targetComment = getTargetComment(
      e.target.parentElement.parentElement.parentElement.parentElement.id
    );
    deleteModal.classList.remove("hidden");
    commentsContainer.classList.add("opacity-30");
    commentForm.classList.add("opacity-30");
    console.log(commentForm.classList);
    //event listener for the delete confirmation modal
    deleteCancel.addEventListener("click", () => {
      deleteModal.classList.add("hidden");
      commentsContainer.classList.remove("opacity-30");
      commentForm.classList.remove("opacity-30");
    });
    deleteConfirm.addEventListener("click", () => {
      deleteModal.classList.add("hidden");
      commentsContainer.classList.remove("opacity-30");
      commentForm.classList.remove("opacity-30");
      targetComment.delete();
    });
  }
});

// event listener for submitting new comment
const commentForm = document.querySelector("#comment-form");
const commentInput = document.querySelector("#comment-input");

// variables to hold the state of the new comment when the comment form is submitted, whether it is a reply, an edit or a new comment in itself
let isReply = {
  boolean: false,
  targetComment: null,
};
let isEdit = {
  boolean: false,
  targetComment: null,
};
commentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // if the comment is neither a reply nor an edit
  if (!isEdit.boolean && !isReply.boolean) {
    if (commentInput.value) {
      let comment = new CurrentUserComment(
        createNewComment(commentInput.value)
      );
      comments.push(comment);
      comment.render(commentsContainer);
      updateComments();
    }
  }
  // if the comment is an edit
  else if (isEdit.boolean) {
    isEdit.targetComment.edit(commentInput.value);
    isEdit.boolean = false;
  }
  // if the comment is a reply
  else if (isReply.boolean) {
    console.log(isReply.targetComment);
    isReply.targetComment.reply(
      new CurrentUserComment(createNewComment(commentInput.value))
    );
    isReply.boolean = false;
  }
  commentInput.value = "";
});

// helper functions

// function to get the next available id to be used by comments after rendering
function getAvailableId() {
  let id = 0;
  for (let i = 0; i < comments.length; i++) {
    id += 1;
    if (comments[i].replies.length != 0) {
      id += comments[i].replies.length;
    }
  }
  return id + 1;
}

// function to return a simple comment object from a string that can be passed to the various comment classes
function createNewComment(string, targetComment) {
  return {
    content: string,
    createdAt: Date.now(),
    replies: [],
    id: globalAvailableId++,
    score: 0,
    user: currentUser,
    upvoted: false,
    downvoted: false,
    replyingTo: undefined,
  };
}

// function to get the target comment object of an action

function getTargetComment(locationOfId) {
  // getting the id of the comment where the event occurred
  const commentid = locationOfId;
  // searching for the comment with the id in the comments array
  let targetComment = comments.find((comment) => {
    return comment.id == commentid;
  });
  // if targetComment is not in the comments array, search for the specific comment in the replies of each comment in the array
  if (!targetComment) {
    for (let i = 0; i < comments.length; i++) {
      targetComment = comments[i].replies.find((comment) => {
        return comment.id == commentid;
      });
      if (targetComment != (null || undefined)) {
        break;
      }
    }
  }
  return targetComment;
}

// function to get the time elapsed in minutes, hours, days or months between two dates
function getTimeElapsed(oldDate, newDate) {
  let elapsedTime = +newDate - +oldDate;
  //  if time is greater than a month return number of months elapsed
  if (elapsedTime / (1000 * 60 * 60 * 24 * 30) >= 1) {
    return `${Math.floor(elapsedTime / (1000 * 60 * 60 * 24 * 30))} months ago`;
  }
  //  if time is greater less than a month but greater than a day, return the number of days passed
  if (elapsedTime / (1000 * 60 * 60 * 24) >= 1) {
    return `${Math.floor(elapsedTime / (1000 * 60 * 60 * 24))} days ago`;
  }
  //  if time is greater than an hour, return number of hours passed
  if (elapsedTime / (1000 * 60 * 60) >= 1) {
    return `${Math.floor(elapsedTime / (1000 * 60 * 60))} hours ago`;
  }
  //  if time is greater than a minute, return number of minutes passed
  if (elapsedTime / (1000 * 60) >= 1) {
    return `${Math.floor(elapsedTime / (1000 * 60))} minutes ago`;
  }
  //  if time is not up to a minute, return "now"
  else {
    return "now";
  }
}

// function to update comments array in local storage
function updateComments() {
  localStorage.setItem("comments", JSON.stringify(comments));
}
