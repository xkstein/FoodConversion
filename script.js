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

function set_cursor_eol(text_obj, line_number) {
    var text_before = text_obj.value.split('\n').slice(0, line_number + 1);
    text_before = text_before.join('\n');
    text_obj.setSelectionRange(text_before.length, text_before.length);
}


function generate_prediction(row, search_list) {
    let words = row.split(/\s+/);
    let predictions = []
    if (isNaN(words[0])) {
        words = [];
    } else if (words.length == 2 && words[words.length - 1] != "") {
        const word = words.pop()
        let unit_names = [];
        if (+words[0] == 1) {
            unit_names = Object.keys(units);
        } else {
            for (const unit in units) {
                unit_names.push(units[unit]["plural"]);
            }
        }

        const regex = new RegExp("^" + word, "i");
        for (const unit of unit_names) {
            if (regex.test(unit)) {
                word_case_matched = word + unit.slice(word.length);
                const pred = {
                    "ind": 0,
                    "text": word_case_matched,
                };
                predictions.push(pred);
            }
        }
    } else if ((words.length == 3 && words[words.length - 1] != "") || words.length > 3) {
        const word = words.slice(2).join(' ');
        words = words.slice(0,2);
        const regex_init = new RegExp("^" + word, "i");
        const regex = new RegExp('\\b' + word, "i");
        for (const food_name of search_list) {
            if (regex_init.test(food_name)) {
                word_case_matched = word + food_name.slice(word.length);
                const pred = {
                    "ind": 0,
                    "text": word_case_matched,
                };
                predictions.unshift(pred);
            } else if (regex.test(food_name)) {
                const ind = food_name.search(regex);
                word_case_matched = food_name.slice(0, ind) + word + food_name.slice(ind + word.length);
                const pred = {
                    "ind": ind,
                    "text": word_case_matched,
                };
                predictions.push(pred);
            }
        }
    }
    predictions.sort((a, b) => a["text"].length - b["text"].length);
    return predictions;
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
                const tmp = predictions[cursor_pos[0]].pop();
                predictions[cursor_pos[0]].unshift(tmp);

                pred_text[cursor_pos[0]] = pred_text[cursor_pos[0]].slice(0,2);
                pred_text[cursor_pos[0]].push(...predictions[cursor_pos[0]][0]["text"].split(" "));

                let input_area_rows = input_area.value.split('\n');
                let edited_row = input_area_rows[cursor_pos[0]].split(/\s+/);
                let last_text = '';
                if (edited_row.length == 2) {
                    last_text = edited_row.pop();
                } else if (edited_row.length > 2) {
                    last_text = edited_row.slice(2).join(' ');
                    edited_row = edited_row.slice(0,2);
                }
                for (let i = 0; i < predictions[cursor_pos[0]][0]["ind"]; i++) {
                    edited_row.push('');
                }
                edited_row.push(last_text);
                input_area_rows[cursor_pos[0]] = edited_row.join(' ');

                pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
                input_area.value = input_area_rows.join('\n')
                set_cursor_eol(input_area, cursor_pos[0]);
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
                const tmp = predictions[cursor_pos[0]].shift();
                predictions[cursor_pos[0]].push(tmp);

                pred_text[cursor_pos[0]] = pred_text[cursor_pos[0]].slice(0,2);
                pred_text[cursor_pos[0]].push(...predictions[cursor_pos[0]][0]["text"].split(" "));
                
                let input_area_rows = input_area.value.split('\n');
                let edited_row = input_area_rows[cursor_pos[0]].split(/\s+/);
                let last_text = '';
                if (edited_row.length == 2) {
                    last_text = edited_row.pop();
                } else if (edited_row.length > 2) {
                    last_text = edited_row.slice(2).join(' ');
                    edited_row = edited_row.slice(0,2);
                }
                for (let i = 0; i < predictions[cursor_pos[0]][0]["ind"]; i++) {
                    edited_row.push('');
                }
                edited_row.push(last_text);
                input_area_rows[cursor_pos[0]] = edited_row.join(' ');

                pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
                input_area.value = input_area_rows.join('\n')
                set_cursor_eol(input_area, cursor_pos[0]);
                skip_up = true;
                e.preventDefault();
                console.log("ArrowZDown");
            }
        } catch (err) {
            if (!(err instanceof TypeError)) {
                throw err;
            }
        }
    } else if (e.key == "Backspace") {
        predictions[cursor_pos[0]] = [];
    }
});

input_area.addEventListener("keyup", (e) => {
    cursor_pos = get_cursor_position(input_area);

    if (skip_up) {
        skip_up = false;
        e.preventDefault();
        return
    }
    const input_area_rows = input_area.value.split('\n');
    const row = input_area_rows[cursor_pos[0]];
    let input_area_rows_out = [];
    pred_text = [];
    valid_text = [];
    var row_ind = 0;

    for (const row of input_area_rows) {
        const prediction_list = generate_prediction(row, food_names);
        predictions[row_ind] = prediction_list;

        let pred_row = row.split(/\s+/);
        if (prediction_list.length) {
            if (pred_row.length == 2) {
                pred_row.pop();
            } else if (pred_row.length > 2) {
                pred_row = pred_row.slice(0,2);
            }
            pred_row.push(prediction_list[0]["text"]);

            let edited_row = row.split(/\s+/);
            let last_text = '';
            if (edited_row.length == 2) {
                last_text = edited_row.pop();
            } else if (edited_row.length > 2) {
                last_text = edited_row.slice(2).join(' ');
                edited_row = edited_row.slice(0,2);
            }
            for (let i = 0; i < prediction_list[0]["ind"]; i++) {
                edited_row.push('');
            }
            edited_row.push(last_text);
            input_area_rows_out.push(edited_row.join(' '));
        } else {
            pred_row = [];
            input_area_rows_out.push(row);
        }
        pred_text.push(pred_row);

        if (row == pred_row.join(' ') && row.split(' ').length > 2) {
            valid_text.push(pred_row);
        } else {
            valid_text.push([]);
        }

        row_ind += 1;
    }

    pred_area.innerHTML = pred_text.map(row => row.join(' ')).join('<br />');
    valid_area.innerHTML = valid_text.map(row => row.join(' ')).join('<br />');
    out_area.innerHTML = generate_weight(valid_text).map(row => row.join(' ')).join('\n');
    input_area.value = input_area_rows_out.join('\n')
});