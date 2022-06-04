(function () {
    var stateKey = 'random_state_key';

    /**
     * Obtains parameters from the hash of the URL
     * @return Object
     */
    function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    function generateRandomString(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }


    var params = getHashParams();
    var access_token = params.access_token,
        state = params.state,
        storedState = localStorage.getItem(stateKey);
    if (access_token && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    } else {/*
        localStorage.removeItem(stateKey);
        if (access_token) {
            $.ajax({
                url: 'https://api.fib.upc.edu/v2/jo/',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    $('#nom').text(response.nom);
                    $('#cognoms').text(response.cognoms);
                    $('#login').hide();
                    $('#loggedin').show();
                }
            });

            var request = new XMLHttpRequest();
            request.open('GET', 'https://api.fib.upc.edu/v2/jo/foto.jpg', true);
            request.setRequestHeader('Authorization', 'Bearer ' + access_token);
            request.responseType = 'arraybuffer';
            request.onload = function (e) {
                var data = new Uint8Array(this.response);
                var raw = String.fromCharCode.apply(null, data);
                var base64 = btoa(raw);
                var src = "data:image;base64," + base64;

                $("#foto").attr('src', src);
            };

            request.send();
        } else {
            $('#login').show();
            $('#loggedin').hide();
        }*/
        $('#login-button').bind('click', function () {
            var client_id = 'P2QFjmRfIHRfgmJ8agGimwSiP0WjlU4Uxk7bjftu';
            var redirect_uri = 'https://romeuesteve.github.io';
            var state = generateRandomString(16);
            localStorage.setItem(stateKey, state);
            var url = 'https://api.fib.upc.edu/v2/o/authorize/';
            url += '?client_id=' + encodeURIComponent(client_id);
            url += '&redirect_uri='+encodeURIComponent(redirect_uri);
            url += '&response_type=token';
            url += '&state=' + encodeURIComponent(state);
            window.location = url;
        });
    }
})();
