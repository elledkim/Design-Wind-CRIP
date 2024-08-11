args <- commandArgs(trailingOnly = TRUE)

risk_category <- as.integer(args[1])
build_year <- as.integer(args[2])
lifespan <- as.integer(args[3])

# Get the current working directory
script_dir <- getwd()
cat("Current working directory: ", script_dir, "\n")  # Print to verify the working directory

# Ensure the generated_csvs directory exists inside the R directory
output_dir <- file.path(script_dir, "generated_csvs")
if (!dir.exists(output_dir)) {
  cat("Creating output directory: ", output_dir, "\n")
  dir.create(output_dir)
}

# Load required data and source files
tryCatch({
  load(file.path(script_dir, "sysdata_winds.Rdata"))
  load(file.path(script_dir, "sysdata.rda")) # fit_data contains all needed parameters
}, error = function(e) {
  cat("Error loading data files:", e$message, "\n")
  stop(e)
})

# Load required libraries
library(scales)
library(ggplot2)

source("nonstationary_return.R")
source("nonstationary_return_MRI.R")
source("nonstationary_return_AEP.R")
source("design_wind_speed_v2024.R")
source("design_wind.R")
source("design_wind_AEP.R")
source("design_wind_MRI.R")
source("design_wind_static.R")
source("design_wind_AEP_static.R")
source("design_wind_MRI_static.R")
source("xu.R")
source("LEP.R")
source("xu_LEP.R")
source("AEP.R")

# Prepare the data frame with specified columns
nCounties <- length(fit_data$county_fips)

csv_cases <- data.frame(integer(nCounties),integer(nCounties),integer(nCounties),integer(nCounties),integer(nCounties),
                        integer(nCounties),integer(nCounties),integer(nCounties),integer(nCounties),integer(nCounties), integer(nCounties), integer(nCounties))
colnames(csv_cases) <- c("ID","X","Y","STATEFP","COUNTYFP",
                         "BUILDYEAR","LIFESPAN","RISKCAT","METHOD","XD_MRI", "XD_LEP", "XD_AEP")

# Calculate the design wind speeds for each method
tryCatch({
  for (c in 1:nCounties) {
    fips <- fit_data$county_fips[c]
    csv_cases[c, "XD_MRI"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "MRI")
    csv_cases[c, "XD_LEP"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "LEP")
    csv_cases[c, "XD_AEP"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "AEP")
    csv_cases[c, "XD2_MRI"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "MRI-Static")
    csv_cases[c, "XD2_LEP"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "LEP-Static")
    csv_cases[c, "XD2_AEP"] <- design_wind_speed_v2024(fips, lifespan, build_year, risk_category, "AEP-Static")
    csv_cases[c, "ID"] <- fips
    csv_cases[c, "X"] <- fit_data$Longitude[c]
    csv_cases[c, "Y"] <- fit_data$Latitude[c]
    csv_cases[c, "STATEFP"] <- substr(toString(fips), 1, 2)
    csv_cases[c, "COUNTYFP"] <- substr(toString(fips), 3, 5)
    csv_cases[c, "BUILDYEAR"] <- build_year
    csv_cases[c, "LIFESPAN"] <- lifespan
    csv_cases[c, "RISKCAT"] <- risk_category
  }
}, error = function(e) {
  cat("Error calculating design wind speeds:", e$message, "\n")
  stop(e)
})

# Write the CSV file to the correct directory inside the R folder
output_filename <- paste0("US_counties_Gori200_", build_year, "_", lifespan, "_", risk_category, ".csv")

tryCatch({
  write.csv(csv_cases, file.path(output_dir, output_filename), row.names = FALSE)
  cat("CSV file generated successfully.\n")
  cat(output_filename, "\n")
}, error = function(e) {
  cat("Error writing CSV file:", e$message, "\n")
  stop(e)
})