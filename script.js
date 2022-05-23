let units = {
    "cup":{
        "volume": 236.588,
        "plural": "cups",
    },
    "gallon":{
        "volume": 3785.41,
        "plural": "gallons",
    },
    "floz":{
        "volume": 29.5735,
        "plural": "floz",
    },
    "teaspoon":{
        "volume": 4.92892,
        "plural": "teaspoons",
    },
    "tablespoon":{
        "volume": 14.7868,
        "plural": "tablespoons",
    },
};

food_names = Object.keys(food_database);
food_names.sort()

let input_area=document.getElementById("input_area");
let out_area=document.getElementById("out_area");
let pred_area=document.getElementById("prediction");
let valid_area=document.getElementById("indicator");
let pred_text=[];
let valid_text=[];
let predictions=[];
let skip_up=false;

function get_cursor_position(text_obj) {
    // returns [row, column] for cursor position
    const text_before = text_obj.value.slice(0,text_obj.selectionStart).split('\n');
    return [text_before.length - 1, text_before[text_before.length - 1].length];
  }


function generate_prediction(row, search_list) {
    let words = row.split(' ');
    let predictions = []
    if (words[words.length - 1] == "" || isNaN(words[0])) {
        words = [];
    } else if (words.length == 2) {
        const word = words.pop()
        let unit_names = [];
        if (+words[0] == 1) {
            unit_names = Object.keys(units);
        } else {
            for (const unit in units) {
                unit_names.push(units[unit]["plural"]);
            }
        }

        for (const unit of unit_names) {
            regex = new RegExp("^" + word, "i")
            if (regex.test(unit)) {
                word_case_matched = word + unit.slice(word.length);
                //words.push(word_case_matched);
                //break;
                predictions.push(word_case_matched);
            }
        }
        words.push(predictions[0]);
    } else if (words.length == 3) {
        const word = words.pop()
        for (const food_name of search_list) {
            regex = new RegExp("^" + word, "i");
            if (regex.test(food_name)) {
                word_case_matched = word + food_name.slice(word.length);
                //words.push(word_case_matched);
                //break;
                predictions.push(word_case_matched);
            }
        }
        words.push(predictions[0]);
    } else if (words.length > 3) {
        const word = words.slice(2).join(' ');
        words = words.slice(0,2);
        for (const food_name of search_list) {
            regex = new RegExp("^" + word, "i");
            if (regex.test(food_name)) {
                word_case_matched = word + food_name.slice(word.length);
                //words.push(word_case_matched);
                //break;
                predictions.push(word_case_matched);
            }
        }
        words.push(predictions[0]);
    }
    return [words, predictions];
}

function generate_weight(volume) {
    weight = [];
    for (row of volume) {
        if (!row.length)
            continue;

        let volume_ml = 0;
        let food_name = row.slice(2).join(" ").toLowerCase();
        let density = food_database[food_name][0]["density"];
        let weight_row = [];

        try {
            volume_ml = +row[0] * +units[row[1]]["volume"];
        } catch(e) {
            if (e instanceof TypeError) {
                for (const unit in units) {
                    if (units[unit]["plural"] == row[1]) {
                        volume_ml = +row[0] * +units[unit]["volume"];
                    }
                }
            } else {
                throw e;
            }
        }

        if (density == null) {
            density = food_database[food_name][0]["specific_gravity"];
            if (density == null) {
                console.log("No density or specific gravity for:", food_name);
                continue;
            }
        }

        weight_row.push((+density * volume_ml).toFixed(2));
        weight_row.push("grams", "of");
        weight_row.push(...food_name.split(' '));
        weight.push(weight_row);
    }
    return weight;
}

input_area.addEventListener("keydown", (e) => {
    console.log(e.key);
    cursor_pos = get_cursor_position(input_area);
    if (e.key == "Tab") {
        try {
            if (pred_text[cursor_pos[0]].join(' ').length > cursor_pos[1]) {
                const input_area_rows = input_area.value.split('\n');
                input_area_rows[cursor_pos[0]] = pred_text[cursor_pos[0]].join(" ");
                input_area.value = input_area_rows.join("\n");
            }
        } catch(err) { }
        e.preventDefault();
    } else if (e.key == "Enter") {
        try {
            if (cursor_pos[1] < pred_text[cursor_pos[0]].join(' ').length && cursor_pos[1] == input_area.value.split('\n')[cursor_pos[0]].length) {
                const input_area_rows = input_area.value.split('\n');
                input_area_rows[cursor_pos[0]] = pred_text[cursor_pos[0]].join(" ");
                input_area.value = input_area_rows.join("\n");
                e.preventDefault();
            }
        } catch(err) { }
    } else if (e.key == "ArrowUp") {
        try {
            if (cursor_pos[1] < pred_text[cursor_pos[0]].join(' ').length && cursor_pos[1] == input_area.value.split('\n')[cursor_pos[0]].length) {
                console.log(pred_text[cursor_pos[0]]);
                const tmp = predictions[cursor_pos[0]].pop();
                predictions[cursor_pos[0]].unshift(tmp);

                pred_text[cursor_pos[0]] = pred_text[cursor_pos[0]].slice(0,2);
                pred_text[cursor_pos[0]].push(...predictions[cursor_pos[0]][0].split(" "));
                console.log(predictions[cursor_pos[0]][0]);
                console.log(pred_text[cursor_pos[0]]);

                pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
                skip_up = true;
                e.preventDefault();
            }
        } catch (err) {
            if (!(err instanceof TypeError)) {
                throw err;
            }
        }
    } else if (e.key == "ArrowDown") {
        try {
            if (cursor_pos[1] < pred_text[cursor_pos[0]].join(' ').length && cursor_pos[1] == input_area.value.split('\n')[cursor_pos[0]].length) {
                console.log(pred_text[cursor_pos[0]]);
                const tmp = predictions[cursor_pos[0]].shift();
                predictions[cursor_pos[0]].push(tmp);

                pred_text[cursor_pos[0]] = pred_text[cursor_pos[0]].slice(0,2);
                pred_text[cursor_pos[0]].push(...predictions[cursor_pos[0]][0].split(" "));
                console.log(predictions[cursor_pos[0]][0]);
                console.log(pred_text[cursor_pos[0]]);

                pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
                skip_up = true;
                e.preventDefault();
            }
        } catch (err) {
            if (!(err instanceof TypeError)) {
                throw err;
            }
        }
    }
});

input_area.addEventListener("keyup", (e) => {
    console.log("what", skip_up);
    if (skip_up) {
        skip_up = false;
        console.log("what", skip_up);
        e.preventDefault();
        return
    }
    const input_area_rows = input_area.value.split('\n');
    pred_text = [];
    valid_text = [];
    predictions = [];
    for (const row of input_area_rows) {
        const [prediction_text, prediction_list] = generate_prediction(row, food_names);
        predictions.push(prediction_list);
        pred_text.push(prediction_text);
        if (row == prediction_text.join(' ') && row.split(' ').length > 2) {
            valid_text.push(prediction_text);
        } else {
            valid_text.push([]);
        }
    }
    pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
    valid_area.innerHTML = valid_text.map(row => row.join(' ')).join('<br />');
    out_area.innerHTML = generate_weight(valid_text).map(row => row.join(' ')).join('\n');
});