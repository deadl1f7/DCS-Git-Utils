-- sorter_lib.lua

local global_var_name = ... 
local target_table = _G[global_var_name]

if type(target_table) ~= "table" then
    return nil, "Table '" .. tostring(global_var_name) .. "' not found."
end

-- CONFIGURATION
-- true  = "key = value"      (Clean, standard Lua)
-- false = "['key'] = value"  (Verbose, preserves quotes)
local SIMPLIFY_KEYS = true  

-- Keywords that MUST have brackets if used as keys
local keywords = {
    ["and"]=true, ["break"]=true, ["do"]=true, ["else"]=true, ["elseif"]=true, ["end"]=true,
    ["false"]=true, ["for"]=true, ["function"]=true, ["goto"]=true, ["if"]=true, ["in"]=true,
    ["local"]=true, ["nil"]=true, ["not"]=true, ["or"]=true, ["repeat"]=true, ["return"]=true,
    ["then"]=true, ["true"]=true, ["until"]=true, ["while"]=true
}

local function serialize_sorted(tbl, indent_level)
    indent_level = indent_level or 1
    local indent_str = string.rep("    ", indent_level)
    local result = "{\n"
    
    local keys = {}
    for k in pairs(tbl) do table.insert(keys, k) end
    
    table.sort(keys, function(a, b)
        local ta, tb = type(a), type(b)
        if ta ~= tb then return ta == "number" end 
        if ta == "number" then return a < b end
        return tostring(a) < tostring(b)
    end)

    for _, k in ipairs(keys) do
        local v = tbl[k]
        local key_str

        if type(k) == "number" then
            key_str = "[" .. tostring(k) .. "]"
        
        elseif type(k) == "string" then
            -- CHECK: Do we want to simplify "['key']" to "key"?
            if SIMPLIFY_KEYS and k:match("^[%a_][%w_]*$") and not keywords[k] then
                key_str = k -- Output: airports =
            else
                key_str = '["' .. k .. '"]' -- Output: ["airports"] =
            end
        
        else
            key_str = "[" .. tostring(k) .. "]"
        end

        local val_str
        if type(v) == "table" then
            val_str = serialize_sorted(v, indent_level + 1)
        elseif type(v) == "string" then
            val_str = string.format("%q", v)
        else
            val_str = tostring(v)
        end

        result = result .. indent_str .. key_str .. " = " .. val_str .. ",\n"
    end

    result = result .. string.rep("    ", indent_level - 1) .. "}"
    return result
end

return global_var_name .. " = " .. serialize_sorted(target_table)