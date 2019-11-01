// 관리자 회원 번호
var admin_number = ["13140068", "4"];

// data schema (local storage)
var local_data, v;

var tools = {
    datenow : function(){
        var d = new Date();
        return d.getFullYear() + "/" + d.getMonth() + "/" + d.getDate();
    }
}
var defineData = () => {
    // "local_data" would be synced with Chrome local storage area constantly.
    local_data = {
        blocked_members : Array(),
        /*
        blocked members is a array of objects
        [
        {
            date:
            member_num:
            memo:
        },
        ...
        ]
        */
        blocked_keyword : Array(),
        block_option : true,
    };
    
    // temp data (would not be synced)
    v = {
        blocked_posts : Array(),
        posts: Array(),
        blocked_count : 0
    };
}

// initialize
var init = () =>{
    defineData();
    chrome.runtime.sendMessage({msg:"init", data: local_data}, function(result){
        // data sync with local storage
        if(result != undefined)
            local_data = result;
        console.log("local_data is ...");
        console.table(local_data.blocked_members);
        // get posts from document
        collectPosts();
        // block posts
        blockPosts();
        // create block button
        createButton();
    });
};

var collectPosts = () =>{
    var td = document.querySelectorAll("td.author");
    v.posts = Array.from(td).map(x => x.parentElement);
};

var blockPosts = () => {
    if(v.posts.length != 0 && local_data.blocked_members.length !=0){
        v.posts.forEach((post) => {
            var num = post.querySelector('td.author').children[0]
                                                     .className
                                                     .match(/\d+/g)[0];
            var idx = local_data.blocked_members.findIndex(x => x.member_num == num);
            if(idx > -1){
                v.blocked_posts.push(post);
                v.blocked_count++;
                post.hidden = true;
            }
            if(admin_number.includes(num)){
                v.blocked_posts.push(post);
                post.hidden =true;
            }
        });
    }
    updateBlockCounter();
}

var addBlockMember = (post, num, mm) => {

    var member_info = {
        date: tools.datenow(),
        member_num: num,
        memo : mm
    }

    local_data.blocked_members.push(member_info);

    chrome.runtime.sendMessage({msg:"addBlockMember", data: member_info}, (response) =>{
        if(response)
            console.log("addBlockMember - successfully blocked member list updated");
        else
            console.log("addBlockMember - duplication exists or error occured");
    });
    // hide post
    v.blocked_posts.push(post);
    v.blocked_count++;
    post.hidden = true;

    updateBlockCounter();
};

var updateBlockCounter = () =>{
    var counter = document.getElementById("blockCounter");

    if(counter == null){
        counter = document.createElement('b');
        counter.innerHTML = "차단 글 수 - " + v.blocked_count.toString();
        counter.id = "blockCounter";
        counter.setAttribute("style", "color:red; margin-left: 10px;");

        var upper_menu = document.querySelector(
        "#main > div > div.eq.section.secontent.background-color-content > div > div.ed.board-list > div:nth-child(2) > div.ed.flex.flex-wrap.flex-middle.margin-top-small.margin-bottom-small > div"
        );

        upper_menu.appendChild(counter);
    }else{
        counter.innerHTML = "차단 글 수 - " + v.blocked_count.toString();
    }
};

function createButton(){
    document.addEventListener('DOMSubtreeModified', (evt)=>{
        if(evt.srcElement.id == 'popup_menu_area'){
            var ul = evt.srcElement.firstChild;
            if(ul != undefined || ul != null){
                // get member number
                var member = ul.children[0].innerHTML.match(/\d+/g)[0];

                // add block li
                ul.innerHTML = ul.innerHTML + "<li id='addBlock'><a target='#' style='color:red;'>차단</a></li>";

                document.getElementById("addBlock").addEventListener('click', (evt) =>{
                    var memo = prompt("메모할 내용?");
                    var authors = document.querySelectorAll('td.author');
                    Array.from(authors).forEach((author) =>{
                        var num = author.children[0].className.match(/\d+/g)[0];
                        if(num == member){
                            // add to local storage list and block post
                            addBlockMember(author.parentElement, num, memo);
                        }
                    });
                });
            }
        }
    });
}

init();
