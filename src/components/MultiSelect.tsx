import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  icon?: React.ReactNode
}

export function MultiSelect({ options, selected, onChange, placeholder, icon }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  )

  const isAllSelected = selected.length === 0 || selected.length === options.length

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      const newSelected = selected.filter(item => item !== option)
      onChange(newSelected)
    } else {
      onChange([...selected, option])
    }
  }

  const toggleAll = () => {
    if (isAllSelected && options.length > 0) {
      // If all are selected, unselect all
      onChange([])
    } else {
      // Select all exactly
      onChange(options)
    }
  }

  // Display text logic
  let displayText = placeholder
  if (selected.length > 0 && selected.length < options.length) {
    if (selected.length === 1) {
      displayText = selected[0]
    } else {
      displayText = `${selected.length} selected`
    }
  } else if (selected.length === options.length && options.length > 0) {
    displayText = "All selected"
  } else {
    displayText = "All (Any)"
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 border-2 border-black bg-[#fffdf7] rounded-none font-bold text-black shadow-[2px_2px_0_0_#000] hover:bg-[#ff90e8] transition-colors"
          />
        }
      >
        <div className="flex items-center truncate">
          {icon && <span className="mr-2 text-black">{icon}</span>}
          <span className="truncate max-w-[150px]">{displayText}</span>
        </div>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-black" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-4 border-black rounded-none shadow-[6px_6px_0_0_#000]" align="start">
        <div className="flex items-center border-b-4 border-black p-2 bg-[#ffc900]">
          <Search className="mr-2 h-5 w-5 text-black shrink-0" />
          <Input
            placeholder={`Search ${placeholder}...`}
            className="border-none shadow-none focus-visible:ring-0 bg-transparent font-bold h-8 text-black placeholder:text-black/60 px-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto bg-white p-2">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center font-bold text-sm text-black">
              No results found.
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              {/* Select All Option */}
              <div
                className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-100 border-2 border-transparent hover:border-black transition-colors"
                onClick={(e) => { e.preventDefault(); toggleAll(); }}
              >
                <div className={`mr-3 h-5 w-5 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0_0_#000]`}>
                  {isAllSelected && <Check className="h-4 w-4 text-black font-black" />}
                </div>
                <span className="font-black uppercase text-sm">SELECT ALL</span>
              </div>
              
              <div className="h-px bg-black my-1 w-full" />
              
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option) || isAllSelected
                return (
                  <div
                    key={option}
                    className="flex items-center px-2 py-2 cursor-pointer hover:bg-[#fffdf7] border-2 border-transparent hover:border-black transition-colors"
                    onClick={(e) => { e.preventDefault(); toggleOption(option); }}
                  >
                    <div className={`mr-3 h-5 w-5 border-2 border-black flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#ff90e8]' : 'bg-white'}`}>
                      {isSelected && <Check className="h-4 w-4 text-black font-black" />}
                    </div>
                    <span className="font-semibold text-sm truncate">{option}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
