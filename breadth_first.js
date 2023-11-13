/* Grid variables */
let grid_content = [] 
let temp_grid_content = []
let arrow_states = []
let temp_arrow_states = []
let img_pos = {
    arrows: [],
    flag: {
        pos: null
    },
    robots: []
}

/* Robot clicked variables */
let first_pos = null
let first_move = null
let first_dir = null
let robot_num = null
let clicked = null
let originally_clicked = true

/* Grid solving variables */
let queue = []
let sol_arrows = []
let sol_arrow_states = []
let move_list = []

/* Grid generation variables */
let grid_found = false
let used_pos = []
let robot_pos_list = []
let num_of_robots = 1
let sol_diff = 'easy'

/* Other variables */
let message_arr = []
let message_index = 0
let robots_finished = []
let easy = 4 // less than or equal to this number
let med = [5,10] // lower bound inclusive, upper inclusive
let hard = 10 // greater than this number
let hints_shown = [0, 0, 0, 0]
let hints_fully_shown = [false, false, false, false]
let robot_score_zeros = []
const rob_sprite_src = ['55_src.png', '618_src.png', '89_src.png', '341_src.png']
const rob_sprite_class = ['sprite-55', 'sprite-618', 'sprite-89', 'sprite-341']
const sprite_dims = [20, 24, 22, 25]
let used_height_lvls = []
let grids_made = 0
let comp_iterations = 0

/* Handle when window resizes */
let vmin_7 = null
window.onresize = on_resize
on_resize()

function on_resize() {
    const vmin = (Math.min(...[window.innerWidth, window.innerHeight]))/100
    vmin_7 = 7 * vmin
    set_grid_imgs()
}

window.setInterval(background_anim, 2000)

/* First load */
first_load()

/* Non-visual functions */
async function first_load() {
    make_grid()
    display_grid()
    await delay(1000)
    document.querySelector('#loading_screen').classList.add('loaded') 
    document.querySelector('#grid_cont').classList.remove('loading')
}

function make_grid() {
    grid_found = false
    while (!grid_found) {
        used_pos = []
        img_pos = {
            arrows: [],
            flag: {
                pos: null
            },
            robots: []
        }
        gen_img_pos(num_of_robots)
        let grid_solvable = 0
        sol_arrow_states = []
        sol_arrows = []
        for (let index=0; index<img_pos.robots.length; index++) {
            let fail = false
            queue = []
            temp_arrow_states = arrow_states.slice()
            temp_grid_content = grid_content.slice()
            move_list[index] = []
            set_robot_vars(index)
            let complete = false
            while(!complete) {
                gen_queue()
                const length = queue.length
                if (length) {
                    for (let index=0; index<length; index++) {
                        const queue_item = queue[index]
                        set_grid_arrows(queue_item)
                        const result = check_if_sol()
                        if (result) {
                            complete = true
                            grid_solvable++
                            set_sol(queue_item)
                            break
                        }
                        comp_iterations++
                    }
                } else {
                    complete = true
                    fail = true
                }
            }
            if (!fail) {
                if (grid_solvable === img_pos.robots.length) {
                    if (sol_diff_met(sol_diff)) {
                        grid_found = true 
                    }
                }
            } else {
                break
            }
        }
        grids_made++
    }
    console.log('Grids tried - ', grids_made, 'Iterations attempted - ', comp_iterations)
}

function set_robot_vars(index) {
    const robot = img_pos.robots[index]
    robot_num = index
    first_pos = robot.pos
    first_dir = robot.start_dir
    first_move = robot.first_move
}

async function new_grid() {
    const gen_btn = document.getElementById('gen_btn')
    gen_btn.disabled = true
    gen_btn.style.fontSize = 0
    gen_btn.childNodes[0].nodeValue = ''
    document.getElementById('gen-btn-load').classList.remove('hide')
    document.getElementById('reset_btn').disabled = false
    clicked = null
    reset()
    await delay(100)
    sol_diff = document.querySelector("input[name='diff']:checked").value
    num_of_robots = Number(document.getElementById('robo_num_dropdown').innerText)
    make_grid()
    display_grid()
    await delay(100)
    document.getElementById('gen-btn-load').classList.add('hide')
    gen_btn.childNodes[0].nodeValue = 'Generate'
    gen_btn.style.fontSize = '3vmin'
    gen_btn.disabled = false
}

function calc_next_move(pos) {
    current_grid_item = temp_grid_content[pos]
    
    if (grid_content[pos] === 'flag') {
        return 'finished'
    } else {
        if (move_list[robot_num].length === 0) {
            if (pos_legal(first_move)) {
                move_list[robot_num].push(first_dir)
                temp_grid_content[pos] = 'stop'
                temp_grid_content[first_move] = 'robot'
                return first_move
            } else {
                return 'illegal'
            }
        }
        
        let move = grid_content[pos] 
        
        if (temp_arrow_states[pos] === 0) {
            move = move_list[robot_num][move_list[robot_num].length-1]
        }
        
        let next_pos = get_next_pos(pos, move)
        
        if (!pos_legal(next_pos)) {
            return 'illegal'
        } else {
            move_list[robot_num].push(move)
            temp_grid_content[pos] = 'stop'
            temp_grid_content[next_pos] = 'robot'
            return next_pos
        }
    }
}

function gen_queue() {
    const queue_len = queue.length
    if (queue_len) {
        let new_queue = []
        for (let index=0; index<queue_len; index++) {
            let queue_item = queue[index]
            const iter_num = queue_item.length + 1
            set_grid_arrows(queue_item)
            temp_grid_content = grid_content.slice()
            move_list[robot_num] = []
            let pos = first_pos
            for (let index=0; index<iter_num; index++) {
                pos = calc_next_move(pos)
                if (pos === 'illegal') {
                    break
                }
            }
            if (pos !== 'illegal') {
                if (check_queue_item({pos: pos, state: 1})) {
                    queue_item.push({pos: pos, state: 1})
                    new_queue[new_queue.length] = queue_item.map(a => {return {...a}})  
                    queue_item.pop()
                }      
                if (check_queue_item({pos: pos, state: 0})) {
                    queue_item.push({pos: pos, state: 0})
                    new_queue[new_queue.length] = queue_item.map(a => {return {...a}})
                }
            }
        }
        queue = new_queue.slice()
    } else {
        if (check_queue_item({pos: first_move, state: 1})) {
            queue[queue.length] = []
            queue[queue.length-1][0] = {pos: first_move, state: 1}
        }
        if (check_queue_item({pos: first_move, state: 0})) {
            queue[queue.length] = []
            queue[queue.length-1][0] = {pos: first_move, state: 0}
        }
    }
    move_list[robot_num] = []
    temp_grid_content = grid_content.slice()
}

function gen_img_pos(robot_num) {
    const flag_pos = get_rand_int(81, 0)
    img_pos.flag.pos = flag_pos
    used_pos.push(flag_pos)
    grid_content[flag_pos] = 'flag'
    for (let index=0; index<robot_num; index++) {
        let err = true
        set_robot_score_zero_finished()
        while (err) {
            let rob_pos = get_rand_int(81, 0)
            if (!used_pos.includes(rob_pos)) {
                start_dir = get_rand_int(4, 0)
                first_move = get_next_pos(rob_pos, start_dir)
                let robot_pos_err = 0
                if (pos_legal(first_move)) {
                    if (img_pos.robots.length) {
                        img_pos.robots.forEach(robot => {
                            if ((first_move !== robot.pos) && (robot.first_move !== rob_pos)) {
                                robot_pos_err++
                            } else {
                                robot_pos_err--
                            }
                        })
                    }
                    if (robot_pos_err === img_pos.robots.length) {
                        img_pos.robots.push({pos: rob_pos, start_dir: start_dir, first_move: first_move})
                        used_pos.push(rob_pos)
                        grid_content[rob_pos] = 'robot'
                        temp_grid_content[rob_pos] = 'robot'
                        err = false
                    }
                }
            }
        }
    }
    const len = used_pos.length
    for (let index=0; index<(81-len); index++) {
        let pos = get_rand_int(81, 0)
        while (used_pos.includes(pos)) {
            pos = get_rand_int(81, 0)
        }
        const arrow_dir = get_rand_int(4, 0)
        img_pos.arrows.push([arrow_dir, pos])
        arrow_states[pos] = 1
        used_pos.push(pos)
        grid_content[pos] = arrow_dir
    }
    temp_grid_content = grid_content.slice()
    temp_arrow_states = arrow_states.slice()
    set_move_list()
    set_robot_pos_list()
}

/* Play, Advance 1, reset (visual) functions */
function advance_1() {
    let pos = first_pos
    if (move_list[robot_num].length) {
        const iter_num = move_list[robot_num].length + 1
        move_list[robot_num] = []
        
        for (let index=0; index<robot_pos_list[robot_num].length; index++) {
            const pos = robot_pos_list[robot_num][index]
            temp_grid_content[pos] = grid_content[pos]
        }
        
        for (let index=0; index< iter_num-1; index++) {
            pos = calc_next_move(pos)
        }
        
        set_img(pos, 'stop')
    } else {
        robot_pos_list[robot_num].push(pos)
        set_img(pos, 'stop')
    }
    
    if (temp_arrow_states[pos] === 0) {
        let dont_push = false
        for (let index=0; index<robots_finished.length; index++) {
            if (robots_finished[index]) {
                if (robot_score_zeros[index].includes(pos)) {
                    dont_push = true
                }
            }
        }
        
        if (!dont_push) {
            robot_score_zeros[robot_num].push(pos)
        } 
    }
    
    pos = calc_next_move(pos)
    
    if (pos !== 'illegal') {
        robot_pos_list[robot_num].push(pos)
        set_img(pos, 'robot', robot_num)
        
        if (grid_content[pos] === 'flag') {
            document.querySelector('#adv_btn').disabled = true
            document.querySelector('#play_btn').disabled = false
            grid_content[first_pos] = 'stop'
            move_list.splice(robot_num, 1)
            img_pos.robots.splice(robot_num, 1)
            
            for (let index=0; index<robot_pos_list[robot_num].length; index++) {
                const pos = robot_pos_list[robot_num][index]
                temp_grid_content[pos] = grid_content[pos]
                
                if (temp_arrow_states[pos] === 0) {
                    arrow_states[pos] = 0
                }
                
                set_img(pos, grid_content[pos], robot_num)
            }
            
            if (img_pos.robots.length === 0) {
                document.getElementById('loss').classList.remove('loss')
                document.getElementById('win').classList.add('win')
                send_text('win')
                play_btn.disabled = true
            }
            
            clicked = null 
            robots_finished[robot_num] = true
        } else {
            document.getElementById(pos.toString()).classList.add('clicked-robot')
            clicked = pos.toString()
            let dir = grid_content[pos]
            if (temp_arrow_states[pos] === 0) {
                dir = move_list[robot_num][move_list[robot_num].length-1]
            }
            set_border(pos, dir)
        }
    } else {
        document.querySelector('#adv_btn').disabled = true
        document.querySelector('#hint_btn').disabled = true
        document.getElementById('play_btn').disabled = true
        document.getElementById('reset_btn').disabled = false
        document.getElementById('win').classList.remove('win')
        document.getElementById('loss').classList.add('loss')
        send_text('loss')
    }
}

function reset() {
    document.getElementById('win').classList.remove('win')
    document.getElementById('loss').classList.remove('loss')
    temp_grid_content = grid_content.slice()
    set_robot_pos_list()
    set_grid_imgs()
    set_move_list()
    hints_shown = [0,0,0,0]
    hints_fully_shown = [false, false, false, false]
    document.querySelector('#hint_btn').disabled = false
    const play_btn = document.querySelector('#play_btn')
    play_btn.disabled = false
    if (clicked) {
        if (originally_clicked) {
            document.querySelector('#adv_btn').disabled = false
            document.getElementById(first_pos).classList.add('clicked-robot')
            clicked = first_pos.toString()  
        } else {
            clicked = null
        }
    } else {
        document.querySelector('#adv_btn').disabled = true
        document.querySelector('#hint_btn').disabled = true
    }
    for (let index=0; index<robots_finished.length; index++) {
        if (!robots_finished[index]) {
            robot_score_zeros[index] = []
        }
    }
    originally_clicked = true
}

async function play() {
    document.querySelector('#play_btn').disabled = true
    document.querySelector('#adv_btn').disabled = true
    document.querySelector('#reset_btn').disabled = true
    document.querySelector('#hint_btn').disabled = true
    if (!clicked) {
        originally_clicked = false
        const len = img_pos.robots.length
        for (let index=0; index<len; index++) {
            set_robot_vars(len-1-index)
            
            const num_of_rob_moves = robot_pos_list[robot_num].length
            num_of_rob_moves ? clicked = robot_pos_list[robot_num][num_of_rob_moves - 1] : clicked = first_pos
            
            let finished = false
            let err = false
            
            while (!finished) {
                advance_1()
                const loss_elem = document.getElementById('loss')
                const win_elem = document.getElementById('win')
                if (loss_elem.classList.contains('loss')) {
                    err = true
                    finished = true
                } else if  (win_elem.classList.contains('win') || clicked === null) {
                    finished = true
                } else {
                    await delay(500)        
                }
            }
            if (err === true) {
                break
            }
        }
    } else {
        let finished = false
        
        while (!finished) {
            advance_1()
            const loss = document.getElementById('loss')
            const win_elem = document.getElementById('win')
            
            if (loss.classList.contains('loss') || win_elem.classList.contains('win')) {
                finished = true
            } else {
                await delay(500)        
            }
        }
    }
}

function show_hint() {
    hints_shown[robot_num]++
    
    if (hints_shown[robot_num] === sol_arrow_states[robot_num].filter(x => x===0).length) {
        document.querySelector('#hint_btn').disabled = true
        hints_fully_shown[robot_num] = true
    }
    
    let zeros_found = 0
    const len = sol_arrow_states[robot_num].length
    for (let index=0; index<len; index++) {
        const arrow_state = sol_arrow_states[robot_num][index]
        if (arrow_state === 0) {
            zeros_found++
            if (zeros_found === hints_shown[robot_num]) {
                document.querySelector('#grid-item-'+(sol_arrows[robot_num][index].toString())).classList.add('hint')
            }
        }
    }
}

function send_text(state) {
    let message = 'Fail! A robot crashed!'
    if (state === 'win') {
        let score = 0
        switch (sol_diff) {
            case 'easy':
                score+=10
                break
            case 'med':
                score+=20
                break
            case 'hard':
                score+=30
        }
        score+=(num_of_robots*10)
        message = 'Success! +'+score.toString()+' to score'
        let pos_checked = []
        for (let index=0; index<sol_arrows.length;index++) {
            const sol_arrow_pos_arr = sol_arrows[index]
            const sol_states = sol_arrow_states[index]
            for (let count=0; count<sol_arrow_pos_arr.length; count++) {
                const arrow_pos = sol_arrow_pos_arr[count]
                const arrow_state = sol_states[count]
                if (!pos_checked.includes(arrow_pos) && arrow_state === 0) {
                    pos_checked.push(arrow_pos)
                }
            }
        }
        const num_zero_comp_sol = pos_checked.length
        let num_of_zeros = 0
        for (let index=0; index<robot_score_zeros.length; index++) {
            num_of_zeros+=robot_score_zeros[index].length
        }

        if (num_of_zeros<num_zero_comp_sol) {
            score+=50
            message = 'Wow! Better than the computer! +'+score.toString()+' to score'
        }
        set_score(score)
    }
    document.getElementById('comm_text').innerText = message
    message_arr.push(message)
    message_index = message_arr.length-1
}

function set_score(score) {
    let old_score = 0
    const children = document.getElementById('score_fig_cont').children
    for (let index=0; index<children.length; index++) {
        const child = children[index]
        let mult = 0
        if (index === 0) {
            mult=1000
        } else if (index === 1) {
            mult=100
        } else if (index === 2) {
            mult=10
        } else {
            mult=1
        }
        old_score+=Number(child.innerText)*mult
    }
    const new_score = old_score + score
    if (new_score < 9999) {
        const new_score_arr = new_score.toString().split('')
        while (new_score_arr.length < 4) {
            new_score_arr.unshift(0)
        }
        for (let index=0; index<new_score_arr.length; index++) {
            children[index].innerText = new_score_arr[index]
        }
    }
}

function display_grid() {
    const grid = document.querySelector('#grid')
    if (grid.children.length === 0) {
        for (let index=0; index<81; index++) {
            const div = document.createElement('div')
            div.id = 'grid-item-' + index.toString()
            div.className = 'grid-item'
            grid.appendChild(div)
            const img_cont = document.createElement('div')
            img_cont.className = 'image-cont'
            div.appendChild(img_cont)
            const img = document.createElement('img')
            img.className = 'image'
            img.id = index
            img_cont.appendChild(img)
        }
    }
    temp_arrow_states = []
    set_grid_imgs()
    set_robot_pos_list()
}

/* Helper functions (and styling) */

function set_grid_imgs() {
    if (img_pos.robots.length) {
        for (let index=0; index<img_pos.arrows.length; index++) {
            const arrow_arr = img_pos.arrows[index]
            set_img(arrow_arr[1], arrow_arr[0])
        }
        
        img_pos.robots.forEach(robot => {
            const index = img_pos.robots.indexOf(robot)
            set_img(robot.pos, 'robot', index)
            set_border(robot.pos, robot.start_dir)
        })
        
        set_img(img_pos.flag.pos, 'flag')
    }
}

async function set_img(pos, img=null, robot_ind=null) {
    const grid_item = document.querySelector('#grid-item-'+pos.toString())
    grid_item.classList = ''
    grid_item.classList.add('grid-item')
    
    const img_elem = document.getElementById(pos.toString())
    img_elem.removeEventListener('click', on_robot_click)
    img_elem.removeEventListener('click', toggle_arrow)
    img_elem.classList.add('animation-paused')
    img_elem.classList = ''
    img_elem.classList.add('image')
    img_elem.style.scale = 1
    img_elem.style.width = '7vmin'
    img_elem.style.height = '7vmin'
    img_elem.src = ''
    
    switch (img) {
        case 'robot':
            img_elem.src = rob_sprite_src[robot_ind]
            img_elem.classList.add(rob_sprite_class[robot_ind], 'sprite-anim')
            img_elem.style.scale = (vmin_7/sprite_dims[robot_ind])
            img_elem.style.width = sprite_dims[robot_ind].toString() + 'px'
            img_elem.style.height = sprite_dims[robot_ind].toString() + 'px'
            img_elem.addEventListener('click', on_robot_click)
            break
        case 'flag':
            img_elem.src = 'finish_line.png'
            img_elem.classList.add('no-cursor') 
            break
        case 0:
            img_elem.src = 'red_arrow_up.png'
            break
        case 1:
            img_elem.src = 'red_arrow.png'
            break
        case 2:
            img_elem.src = 'red_arrow_down.png'
            break
        case 3:
            img_elem.src = 'red_arrow_left.png'
            break
        case 'stop':
            img_elem.src = 'stop_sign.png'
            img_elem.classList.add('no-cursor')
            break
    }
    
    if (typeof img === 'number') {
        img_elem.addEventListener('click', toggle_arrow)
        
        if (temp_arrow_states[pos] === 0) {
            img_elem.classList.add('clicked')
        }
    }
}

function background_anim() {
    if (used_height_lvls.length < 94) {
        const background_div = document.createElement('div')
        background_div.className = 'background-anim'

        const img_cont = document.createElement('div')
        img_cont.className = 'image-cont background-cont'
        
        const img_elem = document.createElement('img')
        img_elem.classList.add('image', 'sprite-anim', 'sprite-cross')
        img_elem.src = '460_src.png'
        img_elem.style.width = '20px'
        img_elem.style.height = '20px'
        img_elem.style.scale = (vmin_7/20)
        
        background_div.appendChild(img_cont)
        img_cont.appendChild(img_elem)
        
        let height_lvl = get_rand_int(94, 0)
        while (used_height_lvls.includes(height_lvl)) {
            height_lvl = get_rand_int(94, 0)    
        }
        used_height_lvls.push(height_lvl)
        
        for (let index = 1; index < 7; index++) {
            if (height_lvl < 87) {
                if (!used_height_lvls.includes(height_lvl + index)) {
                    used_height_lvls.push(height_lvl + index)
                }
            }
        }
        
        background_div.style.bottom = height_lvl.toString() + 'vmin'
        background_div.style.backgroundPositionY = '-' + (93 - height_lvl.toString()) + 'vmin'
        document.querySelector('#page').appendChild(background_div)
    }
}

function sol_diff_met() {
    let sol_num_of_zeros = []
    
    for (let index=0; index<sol_arrows.length; index++) {
        const robot_sol_pos = sol_arrows[index]
        const robot_sol_state = sol_arrow_states[index]
        
        for (let count=0; count<robot_sol_pos.length; count++) {
            const sol_pos = robot_sol_pos[count]
            const sol_state = robot_sol_state[count]
            if (sol_state === 0 && !sol_num_of_zeros.includes(sol_pos)) {
                sol_num_of_zeros.push(sol_pos)
            }
        }
    }
    
    switch (sol_diff) {
        case 'easy':
            if (sol_num_of_zeros.length < easy) {
                return true
            }
            break
        case 'med':
            if (sol_num_of_zeros.length > med[0] && sol_num_of_zeros.length <= med[1]) {
                return true
            }
            break
        case 'hard':
            if (sol_num_of_zeros.length > hard) {
                return true
            }
            break
    }
    
    return false
}

function set_robo_num() {
    const dropdown = document.querySelector('#robo_num_dropdown')
    const val = get_val_from_dropdown(event.target.id)
    dropdown.innerHTML = val
    switch (val) {
        case 1:
            easy = 4
            med = [5, 10]
            hard = 10
            break
        case 2:
            easy = 12
            med = [12, 20]
            hard = 20
            break
        case 3:
            easy = 12
            med = [12, 25]
            hard = 25
            break
        case 4:
            easy = 10
            med = [10, 22]
            hard = 22
    }
    document.getElementById('easy_val').innerText = easy
    document.getElementById('med_val').innerText = med[0].toString() + '-' + med[1].toString()
    document.getElementById('hard_val').innerText = hard
}

function get_val_from_dropdown(id) {
    return Number(id.split('_')[2])
}

function delay(time) {
    return new Promise(res => setTimeout(res, time))
}

function prev_msg() {
    if (((message_index-1)>=0) && message_arr.length) {
        message_index--
        document.getElementById('comm_text').innerText = message_arr[message_index]    
    }
}

function next_msg() {
    if ((message_index+1) <= message_arr.length-1) {
        message_index++
        document.getElementById('comm_text').innerText = message_arr[message_index]    
    }
}

function set_sol(arrow_obj_list) {
    let pos_array = []
    let state_array = []
    const len = arrow_obj_list.length
    for (let index = 0; index<len; index++) {
        obj = arrow_obj_list[index]
        pos_array.push(obj.pos)
        state_array.push(obj.state)
    }
    sol_arrow_states[sol_arrow_states.length] = state_array
    sol_arrows[sol_arrows.length] = pos_array
}

function on_robot_click(event) {
    const element = document.getElementById(event.target.id)
    if (clicked !== event.target.id) {
        if (clicked) {
            document.getElementById(clicked).classList.remove('clicked-robot') 
        }
        
        element.classList.add('clicked-robot')
        clicked = event.target.id  
        document.querySelector('#adv_btn').disabled = false
        
        if (move_lists_empty()) {
            let robot = null
            
            for (let index=0; index<img_pos.robots.length; index++) {
                robot = img_pos.robots[index]
                if (robot.pos.toString() === clicked) {
                    set_robot_vars(index)
                    break
                }
            } 
        } else {
            for (let index=0; index<move_list.length; index++) {
                set_robot_vars(index)
                if (move_list[index].length) {
                    const iter_num = move_list[index].length
                    for (let index=0; index<robot_pos_list[robot_num].length; index++) {
                        const pos = robot_pos_list[robot_num][index]
                        temp_grid_content[pos] = grid_content[pos] 
                    } 
                    move_list[index] = []
                    let pos = first_pos
                    for (let index=0; index<iter_num; index++) {
                        pos = calc_next_move(pos)
                    }
                    if (pos.toString() === clicked) {
                        set_robot_vars(index)
                        break
                    }
                } else {
                    if (first_pos.toString() === clicked) {
                        set_robot_vars(index)
                        break
                    }
                }
            }
        }
        
        if (!hints_fully_shown[robot_num]) {
            document.querySelector('#hint_btn').disabled = false        
        } else {
            document.querySelector('#hint_btn').disabled = true
        }
    } else {
        element.classList.remove('clicked-robot') 
        clicked = null
        document.querySelector('#adv_btn').disabled = true
        document.querySelector('#hint_btn').disabled = true
    }
}

function move_lists_empty() {
    let empty = 0
    for (let index=0; index<img_pos.robots.length; index++) {
        if (move_list[index].length === 0) {
            empty++
        }
        if (empty === img_pos.robots.length) {
            return true
        }
    }
    return false
}

function toggle_arrow(event) {
    const element = document.getElementById(event.target.id)
    if (element.classList.contains('clicked')) {
        element.classList.remove('clicked')
        temp_arrow_states[event.target.id] = 1
    } else {
        element.classList.add('clicked')
        temp_arrow_states[event.target.id] = 0
    }
}

function set_border(pos, dir) {
    const grid_elem = document.getElementById('grid-item-'+pos.toString())
    switch (dir) {
        case 0:
            grid_elem.classList.add('border-top')
            break
        case 1:
            grid_elem.classList.add('border-right')
            break
        case 2:
            grid_elem.classList.add('border-bottom')
            break
        case 3:
            grid_elem.classList.add('border-left')
    }
}

function set_move_list() {
    for (let index=0; index<img_pos.robots.length; index++) {
        move_list[index] = []
    }
}

function set_robot_pos_list() {
    for (let index=0; index<img_pos.robots.length; index++) {
        robot_pos_list[index] = []
    }
}

function remove_class(pos, class_name, grid_elem=false) {
    if (grid_elem) {
        const elem = document.getElementById('grid-item-'+pos.toString())
        
        if (class_name === 'border') {
            for (let index=0; index<elem.classList.length; index++) {
                const img_class = elem.classList[index]
                
                if (img_class.includes('border')) {
                    elem.classList.remove(img_class)
                }
            }
        } else {
            elem.classList.remove(class_name)
        } 
    } else {
        const elem = document.getElementById(pos.toString())
        elem.classList.remove(class_name)
    }
}

function get_next_pos(pos, move) {
    const row_num = Math.floor(pos/9)
    const col_num = pos - (row_num*9)
    let inds = [row_num, col_num]
    switch (move) {
        case 0:
            inds[0] = inds[0]-1
            break
        case 1:
            inds[1] = inds[1]+1
            break
        case 2:
            inds[0] = inds[0]+1
            break
        case 3:
            inds[1] = inds[1]-1
    }
    length = inds.length
    let err = false
    for (let index=0; index<length; index++) {
            const ind = inds[index]
            if ((ind>8) || (ind<0)) {
                err = true
                break
            }
        }
    if (err) {
        return -1
    } else {
        return (inds[0]*9) + inds[1]
    } 
}

function pos_legal(pos) {
    if ((pos < 0) || (pos > 80)) {
        return false
    }
    
    if (temp_grid_content[pos] === 'stop' || temp_grid_content[pos] === 'robot') {
        return false
    }
    return true
}

function check_queue_item(queue_obj) {
    const sol_num = sol_arrows.length
    const arrow_pos = queue_obj.pos
    const arrow_state = queue_obj.state
    for (let index=0; index<sol_num; index++) {
        const sol = sol_arrows[index]
        if (sol.includes(arrow_pos)) {
            const sol_ind = sol.indexOf(arrow_pos)
            const state = sol_arrow_states[index][sol_ind]
            if (state === arrow_state) {
                return true
            } else {
                return false
            }
        }
    }
    return true
}

function check_if_sol() {
    let finished = false
    success = false
    let pos = first_pos
    while (!finished) {
        pos = calc_next_move(pos)
        if (pos === 'finished') {
            finished = true
            success = true
        } else if (pos === 'illegal') {
            finished = true
        }
    }
    move_list[robot_num] = []
    temp_grid_content = grid_content.slice()
    if (success) {
        return true
    }
    return false 
}

function set_grid_arrows(arrow_state) {
    temp_arrow_states = arrow_states.slice()
    arrow_state.forEach(state_obj => {
        temp_arrow_states[state_obj.pos] = state_obj.state
    })
}

function set_robot_score_zero_finished() {
    robot_score_zeros = []
    robots_finished = []
    for (let index=0; index<num_of_robots; index++) {
        robot_score_zeros.push([])
        robots_finished.push(false)
    }
}

function get_rand_int(max, min) {
    min = Math.ceil(min); // inclusive
    max = Math.floor(max); // exclusive
    return Math.floor(Math.random() * (max - min) + min);
}

function get_inds(pos) {
    const row_num = Math.floor(pos/9)
    const col_num = pos - (row_num*9)
    return [row_num, col_num]
}
