#!/usr/bin/env ruby

require 'fileutils'
require 'optparse'

options = {
	:dirs => [],
	:size => '640',
}

optParse = OptionParser.new do |opts|
  opts.banner = "Usage: #{$0} -o outputDir [-d imageDir]|[imageDir] ... "

	opts.on("-r", "--resize SIZE", "New size. Used in mogrify --resize SIZE") do |size|
    options[:size] = d
	end

  opts.on("-o", "--output-dir DIR", "Output directory for the resized images") do |d|
    options[:out] = d
  end

  opts.on("-d", "--directory DIR", "Add directory of images with glob pattern") do |d|
    options[:dirs] << d
  end

end
optParse.parse!

if not options[:out] then
	puts "Please specify output directory"
	puts
	puts optParse.help
	exit
end
dirs = options[:dirs]
dirs += ARGV.map { |d| d + (d.end_with?('/') ? '*' : '/*') }

outDir = options[:out] + (options[:out].end_with?('/') ? '' : '/')
count = 0
dirs.each do |dir|
	puts "Adding " +  dir
	Dir.glob(dir).each do |file|
		file =~ /(\.[^.]+)$/
		outFile = outDir + count.to_s + $1.to_s
		count += 1
		FileUtils.cp file, outFile
		mogCmd = ["mogrify", "-resize", options[:size], outFile]
		if !system(*mogCmd) then
			puts "There was error invoking :" + mogCmd.to_s
			exit(1)
		end
	end
	
end
