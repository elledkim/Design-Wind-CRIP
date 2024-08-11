nonstationary_return_MRI <- function(N,lat,long,sigma,xi,u,lambda,NTC_coeff){
  test_value_i = ceiling(max(u))
  MRI = 0
  while (N>MRI) {
    T_TC = (1-exp(-lambda[1]*(1+(xi[1]*(test_value_i-u[1])/
                                   (sigma[1])))^(-1/xi[1])))^(-1)
    if (is.na(T_TC))
      T_TC = Inf
    T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
    MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
    if (MRI < 0) {
      MRI = 0
    }
    test_value_i = test_value_i + 1
  }
  test_value_f = ceiling(max(u))
  MRI = 0
  while (N>MRI) {
    T_TC = (1-exp(-lambda[2]*(1+(xi[2]*(test_value_f-u[2])/
                                   (sigma[2])))^(-1/xi[2])))^(-1)
    if (is.na(T_TC))
      T_TC = Inf
    T_NTC = (1-exp(-exp(-(test_value_i-NTC_coeff[1])/NTC_coeff[2])))^(-1)
    MRI = (1-(1-1/T_TC)*(1-1/T_NTC))^(-1)
    if (MRI < 0) {
      MRI = 0
    }
    test_value_f = test_value_f + 1
  }
  xd = max(test_value_i,test_value_f) - 1
  return(xd)
}