#!/usr/bin/perl
use strict;
use warnings;
use JSON;
use File::Basename;
use CGI;
print "Content-Type: application/json\n\n";

# Chemin vers les fichiers GNSS
my $folder_path = "../Fichiers_stations/";

# Liste des fichiers dans le dossier
my @files = glob("$folder_path/*.txt");
die encode_json({ "error" => "Aucun fichier trouvé dans le dossier." }) if scalar @files == 0;

# Variables de stockage
my %results;
my %station_info;
my @periods;
my $proc = "";
my @column_names;

foreach my $file (@files) {
    my $file_name = basename($file);
    
    open my $file_handle, '<', $file or die encode_json({ "error" => "Impossible d'ouvrir le fichier: $file_name" });
    my @file_content = grep { $_ ne "" } <$file_handle>;
    close $file_handle;

    # Variables pour les métadonnées
    my ($node_code, $node_name, $node_url, $node_lat, $node_lon, $node_elevation) = (undef, undef, undef, undef, undef, undef);

    # Lecture de l'en-tête
    foreach my $line (@file_content) {
        $line = trim($line);
        if ($line =~ /PROC:/) {
            $proc = extract_value($line);
            $proc =~ s/[{}]//g;
        } elsif ($line =~ /NODE_FID:/) {
            $node_code = extract_value($line);
        } elsif ($line =~ /NODE_NAME:/) {
            $node_name = extract_value($line);
        } elsif ($line =~ /NODE_LATITUDE:/) {
            $node_lat = $line =~ /NODE_LATITUDE:/ ? 0 + extract_value($line) : undef;
        } elsif ($line =~ /NODE_LONGITUDE:/) {
            $node_lon = $line =~ /NODE_LONGITUDE:/ ? 0 + extract_value($line) : undef;
        } elsif ($line =~ /NODE_ELEVATION:/) {
            $node_elevation = $line =~ /NODE_ELEVATION:/ ? 0 + extract_value($line) : undef;
        } elsif ($line =~ /NODE_URL:/) {
            $node_url = extract_value($line);
        } elsif ($line =~ /TIME_PERIODS:/) {
            @periods = map { int($_) } split(',', extract_value($line));
        } elsif ($line =~ /yyyy mm dd/) {
            @column_names = split(/\s+/, $line);
            last;
        }
    }

    # Stockage des infos de la station
    $station_info{$file_name} = {
        "code"      => $node_code,
        "name"      => $node_name,
        "latitude"  => $node_lat,
        "longitude" => $node_lon,
        "elevation" => $node_elevation,
        "url"       => $node_url
    };

    # Lecture des données GNSS
    foreach my $line (@file_content) {
        $line = trim($line);
        next if $line =~ /^#/; # Ignorer les commentaires
        next if $line =~ /yyyy mm dd/; # Ignorer l'en-tête

        my @values = split(/\s+/, $line);
        next if scalar @values < scalar @column_names; # Vérification du format

        my ($year, $month, $day, $hour, $minute, $second) = @values[0..5];
        my $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        $results{$date} //= {}; # Création si inexistant

        my %vectors;
        foreach my $index (0..$#periods) {
            my $index_offset = 6 + $index * 6;
            my @vector = @values[$index_offset..$index_offset + 2];
            my @error = @values[$index_offset + 3..$index_offset + 5];
            
            # Remplacer "NaN" par 0 et convertir en nombre
            for my $i (0..2) {
                $vector[$i] = ($vector[$i] eq "NaN") ? 0 : 0 + $vector[$i];  # Convertir en nombre
                $error[$i]  = ($error[$i] eq "NaN")  ? 0 : 0 + $error[$i];   # Convertir en nombre
            }

            $vectors{$periods[$index]} = {
                "vector" => \@vector,
                "error"  => \@error
            };
        }

        $results{$date}{$file_name} = {
            "vectors" => \%vectors,
            "position" => {
                "lat"       => $node_lat,
                "lon"       => $node_lon,
                "elevation" => $node_elevation
            }
        };
    }
}

# Sortie JSON
print encode_json({
    "proc"      => $proc,
    "stations"  => \%station_info,
    "periods"   => \@periods,
    "data"      => \%results
});

# Fonctions utilitaires
sub trim {
    my ($string) = @_;
    $string =~ s/^\s+|\s+$//g;
    return $string;
}

sub extract_value {
    my ($line) = @_;
    return trim((split(":", $line, 2))[1]);
}
