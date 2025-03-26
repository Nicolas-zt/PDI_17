# This code processes GNSS files and collects station information and data.
use strict;
use warnings;
use JSON;

# Path to GNSS files
my $folder_path = "../Fichiers_stations/";
my @files = glob("$folder_path/*.txt");

# Storage for data
my %results;
my %station_info; # Station information
my @periods;
my $proc = "";    # Dynamically store available periods

foreach my $file (@files) {
    my $file_name = basename($file);
    open my $file_handle, '<', $file or die "Could not open file: $!";
    my @file_content = grep {$_ ne ""} <$file_handle>;
    close $file_handle;

    if (!-d $folder_path) {
        die "The specified folder does not exist.";
    }
    
    if (scalar @files == 0) {
        die "No files found in the folder.";
    }

    # Variables to store header information
    my ($node_code, $node_name, $node_url, $node_lat, $node_lon, $node_elevation) = (undef, undef, undef, undef, undef, undef);

    # Read header
    foreach my $line (@file_content) {
        if ($line =~ /PROC:/) {
            $proc = trim((split(":", $line, 2))[1]);
            $proc =~ s/[{}]//g;  # Extract PROC
        } elsif ($line =~ /NODE_FID:/) {
            $node_code = trim((split(":", $line, 2))[1]);
        } elsif ($line =~ /NODE_NAME:/) {
            $node_name = trim((split(":", $line, 2))[1], ' "');
        } elsif ($line =~ /NODE_LATITUDE:/) {
            $node_lat = sprintf("%.6f", trim((split(":", $line, 2))[1]));
        } elsif ($line =~ /NODE_LONGITUDE:/) {
            $node_lon = sprintf("%.6f", trim((split(":", $line, 2))[1]));
        } elsif ($line =~ /NODE_ELEVATION:/) {
            $node_elevation = sprintf("%.6f", trim((split(":", $line, 2))[1]));
        } elsif ($line =~ /NODE_URL:/) {
            $node_url = trim((split(":", $line, 2))[1]);
        } elsif ($line =~ /TIME_PERIODS:/) {
            @periods = map { int($_) } split(',', trim((split(":", $line, 2))[1]));
        } elsif ($line =~ /yyyy mm dd/) {
            my @column_names = split(/\s+/, trim($line));
            last; # End of header
        }
    }

    # Store station information
    $station_info{$file_name} = {
        "code" => $node_code,
        "name" => $node_name,
        "latitude" => $node_lat,
        "longitude" => $node_lon,
        "elevation" => $node_elevation,
        "url" => $node_url
    };

    # Read GNSS data
    foreach my $line (@file_content) {
        next if $line =~ /^#/; # Ignore comments

        my @values = split(/\s+/, trim($line));
        next if scalar @values < scalar @column_names;

        my ($year, $month, $day, $hour, $minute, $second) = @values[0..5];
        my $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        if (!exists $results{$date}) {
            $results{$date} = {};
        }

        my %vectors;
        foreach my $index (0..$#periods) {
            my $index_offset = 6 + $index * 6;
            $vectors{$periods[$index]} = {
                "vector" => [ map { sprintf("%.6f", $_) } @values[$index_offset..$index_offset + 2] ],
                "error"  => [ map { sprintf("%.6f", $_) } @values[$index_offset + 3..$index_offset + 5] ]
            };
        }

        $results{$date}{$file_name} = {
            "vectors" => \%vectors,
            "position" => {
                "lat" => $node_lat,
                "lon" => $node_lon,
                "elevation" => $node_elevation
            }
        };
    }
}

# Return station information, available periods, and results
print encode_json({
    "proc" => $proc,
    "stations" => \%station_info,
    "periods" => \@periods,
    "data" => \%results
});

sub trim {
    my ($string) = @_;
    $string =~ s/^\s+|\s+$//g;
    return $string;
}

sub basename {
    my ($path) = @_;
    $path =~ s|.*/||; # Remove everything up to the last slash
    return $path;
}