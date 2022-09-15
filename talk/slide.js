function setup_list(el) {
    $(el).find("li").each(function (name, item) {
        $(item).addClass("fade-item");
    });
    let $lif = $(el).find("li").first();
    $lif.addClass("fadein");
    $lif.find("li").addClass("fadein");
}

$(document).ready(function () {

    function setup_all_lists() {
        $(".anim").each(function (name, item) {
            setup_list(item);
        });
    }

    let key = {
        LEFT: 39,
        RIGHT: 37,
        UP: 38,
        DOWN: 40
    };

    $(document).keydown(function (e) {
        let $li, slide_url;
        slide_url = window.location.href.split("#")[1];
        slide_url = slide_url.replace("s", "");
        let slide_id = "#slide" + slide_url;

        switch (e.which) {
            case key.DOWN:
                e.preventDefault();
                $li = $(slide_id + " .fade-item").not(".fadein").first();

                if ($li.length === 0)
                    // $li = $(".fadein:last").parent().parent().siblings().not(".fadein").first();
                    break;

                $li.removeClass("fadeout");
                $li.addClass("fadein");
                $li.find("li").each(function(value, item){
                    $(item).removeClass("fadeout");
                    $(item).addClass("fadein");
                });
                break;
            case key.UP:
                e.preventDefault();
                $li = $(slide_id + " .fadein");

                if ($li.length < 2)
                    break
                $li = $li.last();
                $li.removeClass("fadein");
                $li.addClass("fadeout");
                break;
        }
    });

    setTimeout(setup_all_lists, 5000);


});